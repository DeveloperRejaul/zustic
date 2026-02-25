// handle main core function

import { MainQueryReturnTypes } from "./types";

/**
 * Core query execution function that handles data fetching, caching, and error management.
 * 
 * This function:
 * - Checks cache validity based on timeout
 * - Executes the query function or custom query function
 * - Applies transformations (response, error, body, headers)
 * - Calls success/error callbacks
 * - Updates state with loading, success, and error states
 * 
 * @param arg - The arguments passed to the query
 * @param set - State setter function from Zustic store
 * @param get - State getter function from Zustic store
 * @param def - The endpoint definition containing configuration
 * @param baseQuery - The base query function for making HTTP requests
 * @param cashTimeout - Cache timeout in milliseconds
 * @param isRefetch - Whether this is a force refetch (ignores cache)
 * @returns Promise with either data or error
 */
export const coreFn = async (
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
      // Compute tags after successful response
      let tags = null;
      if(def.providesTags) {
        if(typeof def.providesTags === 'function') {
          tags = def.providesTags(data);
        } else if(Array.isArray(def.providesTags)) {
          tags = def.providesTags;
        }
      }

      set({
        data: data,
        isSuccess: true,
        isLoading: false,
        isFetching: false,
        cashExp: isCashAvilable ? cashTime : (Date.now() + cashTimeout),
        arg,
        tags: tags,
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
