import { useEffect } from "react";
import type { BuilderType, CreateApiParams, EndpointsMap, HooksFromEndpoints, QueryStore } from "types";
import {create} from './state';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createApi<T extends EndpointsMap>( params: CreateApiParams<T> ): HooksFromEndpoints<T> {
  const { baseQuery, endpoints } = params;

  const builder: BuilderType = {
    query: (config) => ({
      type: 'query',
      queryFn: config.query,
    }),
    mutation: (config) => ({
      type: 'mutation',
      queryFn: config.query,
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
      query: async (arg:any) => {
        set({ 
          isLoading: true, 
          isFetching: true
        });
        try {
          const params = def.queryFn(arg);
          const {data, error} = await baseQuery(params)
          if(data) {
            set({
              data: data,
              isLoading: false,
              isError: false,
              isSuccess: true
            });
            return
          }
          set({ 
            isLoading: false,
            isSuccess: false,
            isFetching: false,
            isError: true,
            error: error,
          });
        } catch(e) {
          set({ 
            isLoading: false,
            isSuccess: false,
            isFetching: false,
            isError: true,
            error: e,
          });
        }
      },
    }))

    if (def.type === 'query') {
      hooks[name] = (arg: any) => {
        const {query,...res} = useQueryState()

        useEffect(()=>{
          query(arg)
        },[])
        
        return res
      };
    }

    if (def.type === 'mutation') {
      hooks[name] = () => {
        const {query, isFetching, ...res} = useQueryState()

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