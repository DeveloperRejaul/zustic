import { useEffect } from "react";
import type { ApiMiddleware, ApiPlugin, BuilderType, CreateApiParams, EndpointsMap, HooksFromEndpoints, MainQueryReturnTypes, QueryHookOption, QueryStore } from "./types";
import {create} from '../core';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// handle main core function
const core = async (
  arg:any, 
  set:any, 
  get:any,
  def:any,
  baseQuery:any,
  cashTimeout:number, 
  isRefetch:boolean
):MainQueryReturnTypes => {
  set({isLoading: true});
  try {
    let data=null;
    let error=null;

    // impliment cashing macanisom
    const cashTime = get().cashExp;
    const now = Date.now()
    let isCashAvilable = false;
    if(isRefetch){
      isCashAvilable = false 
    }else if (JSON.stringify(get().arg || {}) !== JSON.stringify(arg || {})) {
      isCashAvilable= false
    }else{
      isCashAvilable = cashTime>= now
    }


    if(isCashAvilable) {
      data = get().data;
    }

    if(!isCashAvilable && def?.queryFnc) {
      set({isFetching: true});
      const {data:d, error:e} = await def?.queryFnc?.(arg, baseQuery)
      if(d) data = d
      if(e) error = e
    }else{
      const params = def.queryFn(arg);
    
      // handle header transform
      if(def?.transformHeader){
        params['headers'] = await def?.transformHeader?.(params?.headers)
      }

      // handle body transform
      if(def?.transformBody){
        params['body'] = await def?.transformBody?.(params?.body)
      }

      if(!isCashAvilable) {
        set({isFetching: true});
        const {data:d, error:e} = await baseQuery(params)
        if(d) data = d
        if(e) error = e
      }
    }

    // handle success response
    if(data){
      // handle transform response
      if(def?.transformResponse) {
        data = await def.transformResponse?.(data,get().data)
      }
      if(def?.onSuccess) {
        await def.onSuccess?.(data)
      }
    }

    // handle error response
    if(error) {
      // handle transform error
      if(def?.transformError){
        error = await def.transformError?.(error,get().error)
      }
      if(def?.onError) {
        await def.onError?.(error)
      }
    }

    if(data) {
      set({
        data: data,
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        cashExp: isCashAvilable ? cashTime : (Date.now() + cashTimeout),
        arg,
      });
      return {data}
    }
    set({ 
      isLoading: false,
      isSuccess: false,
      isFetching: false,
      isError: true,
      error: error,
      arg,
    });
    return {error}
  } catch(e) {
    set({ 
      isLoading: false,
      isSuccess: false,
      isFetching: false,
      isError: true,
      error: e,
      arg,
    });
    return{error: e}
  }
};

// handle main query with middleware
async function mainQuery (
  arg:any, 
  set:any, 
  get:any,
  def:any,
  baseQuery:any,
  cashTimeout:number, 
  isRefetch:boolean, 
  middlewares: ApiMiddleware[],
  plugins: ApiPlugin[]
) {

  const ctx = { arg, def, get, set };
  // beforeQuery hooks
  for (const p of plugins) {
    await p.beforeQuery?.(ctx);
  }

  // handle middleware
  let index = -1;

  const runner = async (i: number): Promise<any> => {
    if (i <= index) throw new Error("next() called multiple times");
    index = i;

    const middleware = middlewares[i];

    if (!middleware) {
      return core(arg, set, get,def,baseQuery,cashTimeout, isRefetch);
    }

    return middleware(ctx,() => runner(i + 1));
  };

  const result = await runner(0);

  // afterQuery hooks
  for (const p of plugins) {
    await p.afterQuery?.(result, ctx);
  }

  // global error hook
  if (result?.error) {
    for (const p of plugins) {
      await p.onError?.(result.error, ctx);
    }
  }


  return result
}

function createApi<T extends EndpointsMap>(params: CreateApiParams<T> ): HooksFromEndpoints<T> {
  const { 
    baseQuery, 
    endpoints, 
    cacheTimeout = 30*1000,
    middlewares=[],
    plugins=[]
  } = params;

  const builder: BuilderType = {
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

  for (const key in defs) {
    const def = defs[key];
    const name = `use${capitalize(key)}` + (def.type === 'query' ? 'Query' : 'Mutation');

    const pMiddlewares = (def.plugins || []).filter(p=> p?.middleware && typeof p.middleware === 'function').map(p=> p.middleware) as ApiMiddleware[]

    const useQueryState = create<QueryStore<any>>((set, get) => ({
      data:null,
      isLoading:false,
      isError:false,
      isFetching:false,
      isSuccess:false,
      error:null,
      arg:null,
      cashExp: 0,
      query:(arg)=> mainQuery(arg, set, get, def, baseQuery, cacheTimeout, false, [...middlewares,...(def.middlewares || []),...pMiddlewares ], [...plugins, ...(def.plugins ||[])]),
      reFetch:() => mainQuery(get()?.arg, set, get, def, baseQuery,cacheTimeout, true, [...middlewares,...(def.middlewares || []), ...pMiddlewares],[...plugins, ...(def.plugins ||[])]),
    }))

    if (def.type === 'query') {
      hooks[name] = (
        arg: any,
        option?:QueryHookOption
      ) => {
        const {skip} = option || {}
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
      hooks[name] = () => {
        const {query, ...res} = useQueryState()

        return [
          query,
          res,
        ] as const;
      };
    }
  }

  return hooks as HooksFromEndpoints<T>;
}

export {
  createApi,
  type ApiPlugin,
  type ApiMiddleware
}