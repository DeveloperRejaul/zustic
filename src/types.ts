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

type MainQueryReturnTypes = Promise<{
    data: any;
    error?: undefined;
} | {
    error: any;
    data?: undefined;
}>


type ApiOption<Arg, R> = {
  transformResponse?: (currData:any,preData:any, )=> Promise<R> | R;
  transformError?: (currError:any,preError:any, )=> Promise<any> | any;
  transformBody?: (body:Arg)=> Promise<any> | any;
  transformHeader?: (header:Record<string, any>)=> Promise<Record<string, any>> | Record<string, any>;
  onError?:(err:any)=>Promise<void> | void
  onSuccess?:(data:R)=>Promise<void> | void
  queryFnc?: (arg:Arg, baseQuery:CreateApiParams<any>['baseQuery']) => MainQueryReturnTypes
}

type QueryDef<Arg, Result> = {
  type: 'query';
  queryFn?: QueryFn<Arg>;
} & ApiOption<Arg, Result>;

type MutationDef<Arg, Result> = {
  type: 'mutation';
  queryFn?: QueryFn<Arg>;
} & ApiOption<Arg, Result>;

type EndpointDef = | QueryDef<any, any> | MutationDef<any, any>;


type MainQueryHookResult<Result> = {
  data?: Result;
  isLoading: boolean;
  isError: boolean;
  isFetching:boolean,
  isSuccess:boolean,
  error:any,
  reFetch: () => MainQueryReturnTypes
};

type MainMutationState<Result> = {
  data?: Result;
  isLoading: boolean;
  isError: boolean;
  isSuccess:boolean,
  error:any,
};

type QueryHookResult<R> = MainMutationState<R> & {
  arg:any
};


export type EndpointsMap = Record<string, EndpointDef>;


export type HooksFromEndpoints<T extends EndpointsMap> = {
  [K in keyof T as  T[K] extends { type: 'query' } ? `use${Capitalize<string & K>}Query` : `use${Capitalize<string & K>}Mutation`]: 
   T[K] extends QueryDef<infer Arg, infer Result> ? (arg: Arg, option?:QueryHookOption) => MainQueryHookResult<Result> : T[K] extends MutationDef<infer Arg, infer Result>
        ? () => readonly [(arg: Arg) => Promise<Result>,  MainMutationState<Result>] : never;
};
export type BuilderType = {
  query<Result, Arg = void>(
    config:{
      query?: (arg: Arg) => QueryFnReturn
    } & ApiOption<Arg, Result>
  ): QueryDef<Arg, Result>;
  mutation<Result, Arg = void>(
    config: {
      query?: (arg: Arg) => QueryFnObj
    } & ApiOption<Arg, Result>
  ):MutationDef<Arg, Result>;
};

type BaseQueryReturn<Data = any, Error = any> = | { data: Data; error?: undefined } | { data?: undefined; error: Error };

export interface CreateApiParams<T extends EndpointsMap> {
  baseQuery: (option: QueryFnReturn) => Promise<BaseQueryReturn>;
  endpoints: (builder: BuilderType) => T;
};



export type QueryStore<T> =  QueryHookResult<T> & {
  query: (arg:any) => MainQueryReturnTypes
  reFetch: () => MainQueryReturnTypes
}


export interface QueryHookOption {
  skip:boolean
}