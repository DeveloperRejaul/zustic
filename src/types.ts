export type Listener = () => void;

export type CreateParamsType<T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
) => T

export type SetSateParams<T> = Partial<T> | ((state: T) => Partial<T>)

export type Middleware<T> = (
  set: (partial: SetSateParams<T>) => void,
  get: () => T
) => (
  next: (partial: SetSateParams<T>) => void
) => (partial: SetSateParams<T>) => void;

// api types 
type QueryFnObj = {
  url:string;
  method:"GET"|"POST"|"PUT"|"DELETE"|"PATCH",
  body?:any,
  headers?: Record<string, any>
}
type QueryFnReturn = string | QueryFnObj

type QueryFn<Arg = any> = (arg: Arg) => QueryFnReturn

type QueryDef<Arg, Result> = {
  type: 'query';
  queryFn: QueryFn<Arg>;
  __result?: Result;
};

type MutationDef<Arg, Result> = {
  type: 'mutation';
  queryFn: QueryFn<Arg>;
  __result?: Result;
};

type EndpointDef = | QueryDef<any, any> | MutationDef<any, any>;

type QueryHookResult<Result> = {
  data?: Result;
  isLoading: boolean;
  isError: boolean;
  isFetching:boolean,
  isSuccess:boolean,
  error:any,
};

type MutationState<Result> = {
  data?: Result;
  isLoading: boolean;
  isError: boolean;
  isSuccess:boolean,
  error:any,
};

export type EndpointsMap = Record<string, EndpointDef>;


export type HooksFromEndpoints<T extends EndpointsMap> = {
  [K in keyof T as  T[K] extends { type: 'query' } ? `use${Capitalize<string & K>}Query` : `use${Capitalize<string & K>}Mutation`]: 
   T[K] extends QueryDef<infer Arg, infer Result> ? (arg: Arg) => QueryHookResult<Result> : T[K] extends MutationDef<infer Arg, infer Result>
        ? () => readonly [(arg: Arg) => Promise<Result>,  MutationState<Result>] : never;
};
export type BuilderType = {
  query<Result, Arg = void>(config: {
    query: (arg: Arg) => QueryFnReturn;
    transformResponse?: ()=> void
  }): QueryDef<Arg, Result>;

  mutation<Result, Arg = void>(config: {
    query: (arg: Arg) => QueryFnObj;
    transformResponse?: ()=> void
  }): MutationDef<Arg, Result>;
};

type BaseQueryReturn<Data = any, Error = any> = | { data: Data; error?: undefined } | { data?: undefined; error: Error };

export type CreateApiParams<T extends EndpointsMap> = {
  baseQuery: (option: QueryFnReturn) => Promise<BaseQueryReturn>;
  endpoints: (builder: BuilderType) => T;
};

export type QueryStore<T> =  QueryHookResult<T> & {
  query: (arg:any) => void
}