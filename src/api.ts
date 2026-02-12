import { useEffect } from "react";
import type { BuilderType, CreateApiParams, EndpointsMap, HooksFromEndpoints, QueryHookOption, QueryStore } from "types";
import {create} from './state';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function mainQuery (arg:any, set:any, get:any,def:any,baseQuery:any) {

  set({ 
    isLoading: true, 
    isFetching: true,
    arg,
  });
  try {
    let data=null;
    let error=null;

    //TODO:in heare impliment middleware
    //TODO:in heare need to impliment cashing macanisom



    if(def?.queryFnc) {
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

      const {data:d, error:e} = await baseQuery(params)
      if(d) data = d
      if(e) error = e
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
        isFetching: false
      });
      return {data}
    }
    set({ 
      isLoading: false,
      isSuccess: false,
      isFetching: false,
      isError: true,
      error: error,
    });
    return {error}
  } catch(e) {
    set({ 
      isLoading: false,
      isSuccess: false,
      isFetching: false,
      isError: true,
      error: e,
    });
    return{error: e}
  }
}

function createApi<T extends EndpointsMap>(params: CreateApiParams<T> ): HooksFromEndpoints<T> {
  const { baseQuery, endpoints } = params;

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

    const useQueryState = create<QueryStore<any>>((set, get) => ({
      data:null,
      isLoading:false,
      isError:false,
      isFetching:false,
      isSuccess:false,
      error:null,
      arg:null,
      query:(arg)=> mainQuery(arg, set, get, def, baseQuery),
      reFetch:() => mainQuery(get()?.arg, set, get, def, baseQuery),
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
        },[])
        
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
  createApi
}