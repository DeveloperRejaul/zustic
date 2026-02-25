import { useEffect } from "react";
import type { ApiMiddleware, ApiPlugin, BuilderType, CreateApiParams, EndpointsMap, HooksFromEndpoints, InferQueryArg, InferQueryResult, QueryHookOption, QueryKeys, QueryStore } from "./types";
import {create} from '../core';
import { queryFn } from "./query";
import { capitalize, createCacheKey, tagMatches } from "./utils";

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

  /**
   * Creates a hook for a query or mutation endpoint.
   * Extracted common logic to avoid code duplication.
   * 
   * @internal Internal helper function
   */
  const createEndpointHook = (key: string, def: any) => {
    const pMiddlewares = (def.plugins || []).filter((p: any) => p?.middleware && typeof p.middleware === 'function').map((p: any) => p.middleware) as ApiMiddleware[]

    if (def.type === 'query') {
      return (arg: any, option?: QueryHookOption) => {
        const cacheKey = createCacheKey(key, arg);
        if (!stors.has(cacheKey)) {
          const store = create<QueryStore<any>>((set, get) => {
            actions.set(cacheKey, { set, get })
            return {
              data: null,
              isLoading: false,
              isError: false,
              isFetching: false,
              isSuccess: false,
              error: null,
              arg: null,
              cashExp: 0,
              query: (arg) => queryFn(
                arg,
                set,
                get,
                def,
                baseQuery,
                cacheTimeout,
                false,
                [...middlewares, ...(def.middlewares || []), ...pMiddlewares, ...pm],
                [...plugins, ...(def.plugins || [])]
              ),
              reFetch: () => queryFn(
                get()?.arg,
                set,
                get,
                def,
                baseQuery,
                cacheTimeout,
                true,
                [...middlewares, ...(def.middlewares || []), ...pMiddlewares, ...pm],
                [...plugins, ...(def.plugins || [])]
              ),
            }
          })
          stors.set(cacheKey, store);
        }
        const { skip } = option || {}
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

        useEffect(() => {
          if (skip) {
            return
          }
          query(arg)
        }, [JSON.stringify(arg || {})])

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

      return () => {
        if (!mutationStore) {
          mutationStore = create<QueryStore<any>>((set, get) => {
            return {
              data: null,
              isLoading: false,
              isError: false,
              isSuccess: false,
              error: null,
              arg: null,
              cashExp: 0,
              query: (arg) => queryFn(
                arg,
                set,
                get,
                def,
                baseQuery,
                0,
                false,
                [...middlewares, ...(def.middlewares || []), ...pMiddlewares, ...pm],
                [...plugins, ...(def.plugins || [])]
              ),
            }
          })
        }

        const {
          query,
          error,
          isError,
          isLoading,
          isSuccess,
          data
        } = mutationStore()

        return [
          query,
          {
            error,
            isError,
            isLoading,
            isSuccess,
            data
          }
        ] as const;
      };
    }
  };

  for (const key in defs) {
    const def = defs[key];
    const name = `use${capitalize(key)}` + (def.type === 'query' ? 'Query' : 'Mutation');
    hooks[name] = createEndpointHook(key, def);
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
   * ```
   */
  function invalidateTags(tags?: TagTypes extends readonly [] ? any[] : (TagTypes[number] | {type: TagTypes[number]; id?: string | number})[]) {
    if (!tags || tags.length === 0) return;

    // Iterate through all cached queries
    for (const [, action] of actions.entries()) {
      const state = action.get();
      const queryTags = state?.tags || [];

      // Check if any query tag matches any invalidation tag
      const shouldInvalidate = tags.some((invalidTag: any) =>queryTags.some((queryTag: any) => tagMatches(invalidTag, queryTag)));

      // Clear the cache for matching queries
      if (shouldInvalidate) {
        action.set({ cashExp: 0 });
        state?.reFetch?.()
      }
    }
  }

  /**
   * Resets the entire API state by clearing the cache for all queries.
   * 
   * This function iterates through all cached queries and sets their cashExp to 0,
   * which effectively invalidates all cached data. It then triggers a re-fetch for each query.
   * 
   * Useful for scenarios like user logout, where you want to clear all sensitive data from the cache.
   * 
   * @example
   * ```typescript
   * // Reset the entire API state (e.g., on user logout)
   * api.utils.resetApiState();
   * ```
   */
  function resetApiState(){
    for(const [, action] of actions.entries()) {
      action.set({cashExp: 0})
      action.get()?.reFetch?.()
    }
  }

  /**
   * Clears cache and refetches a specific query by endpoint key and arguments.
   * 
   * Useful when you want to refresh a single query without affecting others.
   * 
   * @template K - The endpoint key
   * @param key - The endpoint name (e.g., 'getUser', 'getUsers')
   * @param arg - The arguments used when calling the endpoint
   * 
   * @example
   * ```typescript
   * // Refresh a specific user query
   * api.utils.refetchQuery('getUser', {id: 1});
   * ```
   */
  function refetchQuery <K extends QueryKeys<T>>(key: K,  arg: InferQueryArg<T[K]>) {
    const cacheKey = createCacheKey(key as string, arg);
    const action = actions.get(cacheKey);
    if (!action) return;
    action.set({ cashExp: 0 });
    action.get()?.reFetch?.()
  }

  /**
   * Dynamically inject new endpoints into the API after creation.
   * 
   * Useful for code-splitting, lazy-loading endpoints, or building modular APIs.
   * 
   * @param config - Configuration with endpoints to inject
   * 
   * @example
   * ```typescript
   * const api = createApi({...});
   * 
   * // Later, inject more endpoints
   * api.injectEndpoints({
   *   endpoints: (builder) => ({
   *     getProfile: builder.query({
   *       query: () => '/profile',
   *       providesTags: ['profile']
   *     })
   *   })
   * });
   * ```
   */
  function injectEndpoints(config: {endpoints: (builder: BuilderType<TagTypes>) => Partial<T>}): void {
    const newEndpoints = config.endpoints(builder);

    for (const key in newEndpoints) {
      const def = newEndpoints[key as keyof typeof newEndpoints] as any;
      const name = `use${capitalize(key)}` + (def.type === 'query' ? 'Query' : 'Mutation');
      
      // Use the same helper function to avoid code duplication
      hooks[name] = createEndpointHook(key, def);

      // Add to defs so it's not injected again
      (defs as any)[key] = def;
    }
  }


  return {
    ...hooks,
    utils:{
      updateQueryData,
      invalidateTags,
      resetApiState,
      refetchQuery
    },
    injectEndpoints
  } as HooksFromEndpoints<T, TagTypes> & { injectEndpoints: typeof injectEndpoints } ;
}

export {
  createApi,
  type ApiPlugin,
  type ApiMiddleware
}