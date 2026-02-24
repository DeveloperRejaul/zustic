import { useEffect } from "react";
import type { ApiMiddleware, ApiPlugin, BuilderType, CreateApiParams, EndpointsMap, HooksFromEndpoints, InferQueryArg, InferQueryResult, QueryHookOption, QueryKeys, QueryStore } from "./types";
import {create} from '../core';
import { queryFn } from "./query";
import { capitalize, createCacheKey } from "./utils";

/**
 * Creates an API instance with typed queries, mutations, and utilities.
 * 
 * The createApi function is the main entry point for setting up your API.
 * It generates typed hooks for each endpoint defined and provides utility functions
 * for cache management.
 * 
 * @template TagTypes - Union type of tag names for cache invalidation
 * @template T - EndpointsMap type with all endpoints
 * 
 * @param params - Configuration object containing:
 *   - baseQuery: Function to make HTTP requests
 *   - endpoints: Function that defines all API endpoints
 *   - cacheTimeout: (Optional) Cache duration in milliseconds (default: 30s)
 *   - middlewares: (Optional) Global middleware functions
 *   - plugins: (Optional) Plugin objects with lifecycle hooks
 *   - tagTypes: (Optional) Array of tag type strings for cache invalidation
 * 
 * @returns Object containing:
 *   - Generated hooks (useXxxQuery, useXxxMutation) for each endpoint
 *   - utils object with updateQueryData and invalidateTags functions
 * 
 * @example
 * ```typescript
 * const api = createApi({
 *   baseQuery: async (params) => {
 *     const response = await fetch(params.url, {method: params.method});
 *     return {data: await response.json()};
 *   },
 *   tagTypes: ['users', 'posts'] as const,
 *   endpoints: (builder) => ({
 *     getUsers: builder.query<User[]>({
 *       query: () => ({url: '/users', method: 'GET'}),
 *       providesTags: ['users'],
 *     }),
 *     createUser: builder.mutation<User, CreateUserInput>({
 *       query: (body) => ({url: '/users', method: 'POST', body}),
 *       invalidateTags: ['users'],
 *     }),
 *   }),
 * });
 * ```
 */
function createApi<
  const TagTypes extends readonly string[] = readonly [],
  T extends EndpointsMap<TagTypes> = EndpointsMap<TagTypes>
>(params: CreateApiParams<T, TagTypes>): HooksFromEndpoints<T, TagTypes> {
  const { 
    baseQuery, 
    endpoints, 
    cacheTimeout = 30*1000,
    middlewares=[],
    plugins=[],
    tagTypes=[]
  } = params;

  const builder: BuilderType<TagTypes> = {
    query: (config) => ({
      type: 'query',
      queryFn: config.query,
      ...config
    }),

    mutation: (config) => ({
      type: 'mutation',
      queryFn: config.query,
      ...config
    }),
  };

  const defs = endpoints(builder);
  const hooks: Record<string, any> = {};
  const pm = (plugins || []).filter(p=> p.middleware && typeof p.middleware === "function").map(pl=> pl.middleware) as ApiMiddleware[]


  const stors = new Map()
  const actions = new Map()

  for (const key in defs) {
    const def = defs[key];
    const name = `use${capitalize(key)}` + (def.type === 'query' ? 'Query' : 'Mutation');
    const pMiddlewares = (def.plugins || []).filter(p=> p?.middleware && typeof p.middleware === 'function').map(p=> p.middleware) as ApiMiddleware[]
    if (def.type === 'query') {
      hooks[name] = (
        arg: any,
        option?:QueryHookOption
      ) => {
        const cacheKey = createCacheKey(key, arg);
        if (!stors.has(cacheKey)) { 
          const store = create<QueryStore<any>>((set, get) => {
            actions.set(cacheKey, {set, get})
            return{
              data:null,
              isLoading:false,
              isError:false,
              isFetching:false,
              isSuccess:false,
              error:null,
              arg:null,
              cashExp: 0,
              query:(arg)=> queryFn(
                arg, 
                set, 
                get, 
                def, 
                baseQuery, 
                cacheTimeout, 
                false, 
                [...middlewares,...(def.middlewares || []),
                ...pMiddlewares , ...pm], 
                [...plugins, ...(def.plugins ||[])]
              ),
              reFetch:() => queryFn(
                get()?.arg, 
                set, 
                get, 
                def, 
                baseQuery,
                cacheTimeout, 
                true, 
                [...middlewares,...(def.middlewares || []), 
                ...pMiddlewares,...pm],
                [...plugins, ...(def.plugins ||[])]
              ),
            }
          })
          stors.set(cacheKey, store);
        }
        const {skip} = option || {}
        const useQueryState = stors.get(cacheKey)!

        const {
          query,
          error,
          isError,
          isLoading,
          isSuccess,
          reFetch,
          data
        } = useQueryState()

        useEffect(()=>{
          if(skip){
            return
          }
          query(arg)
        },[JSON.stringify(arg || {})])
        
        return {
          error,
          isError,
          isLoading,
          isSuccess,
          data,
          reFetch,
        }
      };
    }

    if (def.type === 'mutation') {
      let mutationStore: any = null;
      
      hooks[name] = () => {
        if (!mutationStore) {
          mutationStore = create<QueryStore<any>>((set, get) => {
            return{
              data:null,
              isLoading:false,
              isError:false,
              isSuccess:false,
              error:null,
              arg:null,
              cashExp: 0,
              query:(arg)=> queryFn(
                arg,
                set, 
                get, 
                def, 
                baseQuery, 
                0, 
                false, 
                [...middlewares,...(def.middlewares || []),
                ...pMiddlewares , ...pm],
                [...plugins, ...(def.plugins ||[])]
              ),
            }
          })
        }
        
        const {
          cashExp,
          arg,
          query,
          ...res
        } = mutationStore()

        return [
          query,
          res,
        ] as const;
      };
    }
  }

  /**
   * Updates cached query data for a specific endpoint and arguments.
   * 
   * Useful for optimistic updates or manual cache manipulation.
   * The updater function receives the current data and should return the updated data.
   * 
   * @template K - The endpoint key
   * @param key - The endpoint name (e.g., 'getUser', 'getPosts')
   * @param arg - The arguments used when calling the endpoint
   * @param updater - Function that receives current data and returns updated data
   * 
   * @example
   * ```typescript
   * api.utils.updateQueryData('getUser', {id: 1}, (draft) => ({
   *   ...draft,
   *   name: 'Updated Name'
   * }));
   * ```
   */
  function updateQueryData <K extends QueryKeys<T>>(key: K,  arg: InferQueryArg<T[K]>, updater: (data: InferQueryResult<T[K]>) => InferQueryResult<T[K]>) {
    const cacheKey = createCacheKey(key as string, arg);
    const action = actions.get(cacheKey);
    if (!action) return;
    action.set({data: updater(action.get()?.data)})
  }

  /**
   * Invalidates cached queries by tag names.
   * 
   * Clears the cache for all endpoints whose providesTags match the provided tags.
   * Supports both simple string tags and object tags with specific IDs.
   * 
   * Useful after mutations to ensure fresh data is fetched.
   * 
   * @param tags - Array of tag strings or tag objects to invalidate
   *   - String format: 'users' (invalidates all queries providing 'users' tag)
   *   - Object format: {type: 'posts', id: '123'} (invalidates specific post with id 123)
   * 
   * @example
   * ```typescript
   * // Invalidate all 'users' related data
   * api.utils.invalidateTags(['users']);
   * 
   * // Invalidate specific items
   * api.utils.invalidateTags([
   *   {type: 'users', id: '1'},
   *   {type: 'posts', id: 'post-abc'}
   * ]);
   * 
   * // Mixed format
   * api.utils.invalidateTags(['users', {type: 'posts', id: '123'}]);
   * ```
   */
  function invalidateTags(tags?: TagTypes extends readonly [] ? any[] : (TagTypes[number] | {type: TagTypes[number]; id?: string | number})[]) {
    
  }

  // function resetApiState(){}
  // function injectEndpoints(){}


  return {
    ...hooks,
    utils:{
      updateQueryData,
      invalidateTags
    },
  } as HooksFromEndpoints<T, TagTypes> ;
}

export {
  createApi,
  type ApiPlugin,
  type ApiMiddleware
}