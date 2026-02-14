
// api types 
type QueryFnObj = {
  url:string;
  method:"GET"|"POST"|"PUT"|"DELETE"|"PATCH",
  body?:any,
  headers?: Record<string, any>
}
type QueryFnReturn = string | QueryFnObj

type QueryFn<Arg = any> = (arg: Arg) => QueryFnReturn

export type MainQueryReturnTypes = Promise<{
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
  middlewares?: ApiMiddleware[],
  plugins?: ApiPlugin[]
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
  cashExp:number
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
  cacheTimeout?:number
  middlewares?: ApiMiddleware[]
  plugins?: ApiPlugin[]
};



export type QueryStore<T> =  QueryHookResult<T> & {
  query: (arg:any) => MainQueryReturnTypes
  reFetch: () => MainQueryReturnTypes
}


export interface QueryHookOption {
  skip:boolean
}

export type MiddlewareContext = {
  arg: any;
  def: any;
  get: any;
  set: any;
};

export type ApiMiddleware = (
  ctx: MiddlewareContext,
  next: () => Promise<{ data?: any; error?: any }>
) => Promise<{ data?: any; error?: any }>;


export type ApiPlugin = {
  name: string;

  // once when api created
  onInit?: (api: {
    baseQuery: any;
    endpoints: any;
  }) => void;

  // before execution
  beforeQuery?: (ctx: PluginContext) => void | Promise<void>;

  // middleware level control
  middleware?: ApiMiddleware;

  // after execution
  afterQuery?: (
    result: any,
    ctx: PluginContext
  ) => void | Promise<void>;

  // global error handler
  onError?: (
    error: any,
    ctx: PluginContext
  ) => void | Promise<void>;
};

type PluginContext = {
  arg: any;
  def: any;
  get: any;
  set: any;
};
