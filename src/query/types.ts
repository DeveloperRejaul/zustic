
/**
 * Query function object structure for HTTP requests.
 * Defines the HTTP method, URL, body, and headers for an API call.
 * 
 * @example
 * ```typescript
 * const queryFnObj: QueryFnObj = {
 *   url: '/api/users/1',
 *   method: 'GET',
 *   headers: {'Authorization': 'Bearer token'}
 * };
 * ```
 */
type QueryFnObj = {
  /** The API endpoint URL */
  url: string;
  /** HTTP method (GET, POST, PUT, DELETE, PATCH) */
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  /** Optional request body */
  body?: any,
  /** Optional HTTP headers */
  headers?: Record<string, any>
}

/**
 * Return type for query functions.
 * Can be either a simple string URL or a full QueryFnObj with method and headers.
 */
type QueryFnReturn = string | QueryFnObj

/**
 * Query function type that transforms arguments into HTTP request parameters.
 * 
 * @template Arg - Type of arguments passed to the query
 * @param arg - Query arguments
 * @returns Either a URL string or QueryFnObj with full HTTP configuration
 * 
 * @example
 * ```typescript
 * const queryFn: QueryFn<{id: number}> = (arg) => ({
 *   url: `/users/${arg.id}`,
 *   method: 'GET'
 * });
 * ```
 */
type QueryFn<Arg = any> = (arg: Arg) => QueryFnReturn

/**
 * Main query return type indicating success (data) or failure (error).
 * Discriminated union for type-safe handling of both cases.
 * 
 * @example
 * ```typescript
 * const result: MainQueryReturnTypes = await query();
 * if ('data' in result) {
 *   // Handle success
 *   console.log(result.data);
 * } else {
 *   // Handle error
 *   console.error(result.error);
 * }
 * ```
 */
export type MainQueryReturnTypes = Promise<{
    /** Successful response data */
    data: any;
    error?: undefined;
} | {
    /** Error from failed request */
    error: any;
    data?: undefined;
}>

type ApiOptionBase<Arg, R> = {
    /**
   * Transform the response data before storing in cache.
   * Useful for normalizing, filtering, or restructuring API responses.
   */
  transformResponse?: (currData: any, preData: any) => Promise<R> | R;
  
  /**
   * Transform error responses for consistent error handling.
   * Useful for extracting error messages or codes.
   */
  transformError?: (currError: any, preError: any) => Promise<any> | any;
  
  /**
   * Transform request body before sending to API.
   * Useful for adding timestamps, user info, or formatting data.
   */
  transformBody?: (body: Arg) => Promise<any> | any;
  
  /**
   * Transform request headers before sending to API.
   * Useful for adding authentication tokens or custom headers.
   */
  transformHeader?: (header: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;
  
  /**
   * Called when the endpoint encounters an error.
   * Useful for error logging, showing toast messages, or retries.
   */
  onError?: (err: any) => Promise<void> | void;
  
  /**
   * Called when the endpoint succeeds.
   * Useful for success logging, showing notifications, or side effects.
   */
  onSuccess?: (data: R) => Promise<void> | void;
  
  /**
   * Custom query function that bypasses the base query.
   * Useful for complex request logic or special handling.
   */
  queryFnc?: (arg: Arg, baseQuery: CreateApiParams<any>['baseQuery']) => MainQueryReturnTypes;
  
  /**
   * Endpoint-level middleware functions.
   * Execute in addition to global middleware.
   */
  middlewares?: ApiMiddleware[];
  
  /**
   * Endpoint-level plugins with lifecycle hooks.
   * Execute in addition to global plugins.
   */
  plugins?: ApiPlugin[];
}

/**
 * Configuration options for both queries and mutations.
 * Provides hooks, transformations, and cache invalidation controls.
 * 
 * @template Arg - Type of arguments passed to the endpoint
 * @template R - Type of response data
 * @template TagTypes - Union type of cache tag strings
 */
type ApiOptionQuery<Arg, R, TagTypes extends readonly string[] = readonly []> = {

  /**
 * Cache tags provided by this endpoint.
 * Used for cache invalidation and management.
 * Can be static array or computed from response data.
 * 
 * @example
 * ```typescript
 * // Static tags
 * providesTags: ['users']
 * 
 * // Dynamic tags from response
 * providesTags: (result) => result 
 *   ? [{type: 'users', id: result.id}]
 *   : []
 * ```
 */
  providesTags?: TagTypes extends readonly [] 
    ? (any[] | ((result: R) => any[]))
    : ((TagTypes[number] | {type: TagTypes[number]; id?: string | number})[] | ((result: R) => (TagTypes[number] | {type: TagTypes[number]; id?: string | number})[]))
} & ApiOptionBase<Arg, R>

/**
 * Configuration options for both queries and mutations.
 * Provides hooks, transformations, and cache invalidation controls.
 * 
 * @template Arg - Type of arguments passed to the endpoint
 * @template R - Type of response data
 * @template TagTypes - Union type of cache tag strings
 */
type ApiOptionMutation<Arg, R> = {} & ApiOptionBase<Arg, R> 

/**
 * Query endpoint definition for read-only data fetching.
 * 
 * Queries are cached and automatically refetched when invalidated.
 * Perfect for GET requests and data fetching operations.
 * 
 * @template Arg - Type of query arguments
 * @template Result - Type of response data
 * @template TagTypes - Union type of cache tag strings
 */
type QueryDef<Arg, Result, TagTypes extends readonly string[] = readonly []> = {
  /** Marks this endpoint as a query (read-only) */
  type: 'query';
  /** Function that builds the query request */
  queryFn?: QueryFn<Arg>;
} & ApiOptionQuery<Arg, Result, TagTypes>;

/**
 * Mutation endpoint definition for write operations (create, update, delete).
 * 
 * Mutations are not cached and must be explicitly invoked.
 * Perfect for POST, PUT, DELETE requests.
 * 
 * @template Arg - Type of mutation arguments/input
 * @template Result - Type of response data
 * @template TagTypes - Union type of cache tag strings
 */
type MutationDef<Arg, Result, TagTypes extends readonly string[] = readonly []> = {
  /** Marks this endpoint as a mutation (write operation) */
  type: 'mutation';
  /** Function that builds the mutation request */
  queryFn?: QueryFn<Arg>;
} & ApiOptionMutation<Arg, Result>;

/**
 * Union type for endpoint definitions.
 * Can be either a query or mutation endpoint.
 * 
 * @template TagTypes - Union type of cache tag strings
 */
type EndpointDef<TagTypes extends readonly string[] = readonly []> = QueryDef<any, any, TagTypes> | MutationDef<any, any, TagTypes>;


/**
 * Return type for query hooks.
 * Provides data, loading states, error information, and refetch capability.
 * 
 * @template Result - Type of response data
 * 
 * @example
 * ```typescript
 * const {data, isLoading, isError, error, reFetch} = useGetUserQuery({id: 1});
 * if (isLoading) return <Spinner />;
 * if (isError) return <Error message={error.message} />;
 * return <User data={data} onRefresh={reFetch} />;
 * ```
 */
type MainQueryHookResult<Result> = {
  /** The fetched data from the endpoint */
  data?: Result;
  /** True while the query is first loading */
  isLoading: boolean;
  /** True if the query encountered an error */
  isError: boolean;
  /** True while refetching data in the background */
  isFetching: boolean,
  /** True if the query completed successfully */
  isSuccess: boolean,
  /** The error object if the query failed */
  error: any,
  /** Function to manually refetch the data */
  reFetch: () => MainQueryReturnTypes
};

/**
 * State type for mutation hooks.
 * Provides result, loading states, and error information.
 * 
 * @template Result - Type of mutation response data
 * 
 * @example
 * ```typescript
 * const [createUser, {data, isLoading, isError}] = useCreateUserMutation();
 * 
 * const handleSubmit = async (input) => {
 *   await createUser(input);
 * };
 * ```
 */
type MainMutationState<Result> = {
  /** The response data from the mutation */
  data?: Result;
  /** True while the mutation is executing */
  isLoading: boolean;
  /** True if the mutation encountered an error */
  isError: boolean;
  /** True if the mutation completed successfully */
  isSuccess: boolean,
  /** The error object if the mutation failed */
  error: any,
};

/**
 * Extended mutation state with cache metadata.
 * Includes argument and cache expiration information.
 * 
 * @template R - Type of response data
 * @internal Internal use only
 */
type QueryHookResult<R> = MainMutationState<R> & {
  /** The arguments used for this query */
  arg: any
  /** Cache expiration timestamp */
  cashExp: number
};


/**
 * Map of endpoint definitions for an API.
 * Keys are endpoint names, values are query/mutation definitions.
 * 
 * @template TagTypes - Tuple of cache tag types (e.g., ['users', 'posts'])
 * 
 * @example
 * ```typescript
 * type UserAPI = EndpointsMap<['users', 'posts']>;
 * // Equivalent to:
 * {
 *   getUser: QueryDef<{id: number}, User, ['users', 'posts']>;
 *   createUser: MutationDef<CreateUserInput, User, ['users', 'posts']>;
 * }
 * ```
 */
export type EndpointsMap<TagTypes extends readonly string[] = readonly []> = Record<string, EndpointDef<TagTypes>>;

/** @internal Infers argument type from a query definition */
export type InferQueryArg<T> = T extends QueryDef<infer Arg, any, any> ? Arg : never;

/**
 * Keys of all query endpoints in an endpoints map.
 * Filters out mutations to get only query names.
 * @internal Internal type utility
 */
export type QueryKeys<T> = {
  [K in keyof T]: T[K] extends QueryDef<any, any, any> ? K : never
}[keyof T];

/** @internal Infers result type from a query definition */
export type InferQueryResult<T> = T extends QueryDef<any, infer Result, any> ? Result : never;

/**
 * Generated hooks and utilities from an endpoints map.
 * Dynamically creates hooks for each query and mutation endpoint.
 * Hook names are generated as useNameQuery or useNameMutation based on endpoint type.
 * 
 * @template T - The endpoints map
 * @template TagTypes - The cache tag types
 * 
 * @example
 * ```typescript
 * // Given this API definition:
 * const api = createApi({
 *   tagTypes: ['users'] as const,
 *   endpoints: (builder) => ({
 *     getUser: builder.query({
 *       query: ({id}) => `/users/${id}`,
 *       providesTags: ['users']
 *     }),
 *     createUser: builder.mutation({
 *       query: (input) => ({
 *         url: '/users',
 *         method: 'POST',
 *         body: input
 *       }),
 *       invalidateTags: ['users']
 *     })
 *   })
 * });
 * 
 * // You get these hooks:
 * api.useGetUserQuery({id: 1});        // Returns {data, isLoading, error, reFetch}
 * api.useCreateUserMutation();          // Returns [mutate, {data, isLoading, error}]
 * api.utils.invalidateTags(['users']);  // Invalidate users cache
 * api.utils.updateQueryData('getUser', {id: 1}, (draft) => {...});
 * ```
 */
export type HooksFromEndpoints<
  T extends EndpointsMap<TagTypes>, 
  TagTypes extends readonly string[] = readonly []
> = {
  [K in keyof T as 
    T[K] extends { type: 'query' }
      ? `use${Capitalize<string & K>}Query`
      : `use${Capitalize<string & K>}Mutation`
  ]:
    T[K] extends QueryDef<infer Arg, infer Result, any>
      ? (arg: Arg, option?: QueryHookOption) => MainQueryHookResult<Result>
      : T[K] extends MutationDef<infer Arg, infer Result, any>
        ? () => readonly [
            (arg: Arg) => Promise<Result>,
            MainMutationState<Result>
          ]
        : never;
} & {
  /** Utilities for cache management and manual updates */
  utils: {
    /**
     * Manually update query cache data with optimistic updates.
     * 
     * @example
     * ```typescript
     * api.utils.updateQueryData('getUser', {id: 1}, (draft) => {
     *   draft.name = 'Updated Name';
     * });
     * ```
     */
    updateQueryData: <K extends QueryKeys<T>>(
      key: K,
      arg: InferQueryArg<T[K]>,
      updater: (data: InferQueryResult<T[K]>) => InferQueryResult<T[K]>
    ) => void;
    
    /**
     * Invalidate cache tags to trigger refetches of affected queries.
     * Supports both string tags and object tags with IDs.
     * 
     * @example
     * ```typescript
     * // Invalidate all users queries
     * api.utils.invalidateTags(['users']);
     * 
     * // Invalidate specific user with ID
     * api.utils.invalidateTags([{type: 'users', id: '123'}]);
     * 
     * // Mix both formats
     * api.utils.invalidateTags(['users', {type: 'posts', id: 'abc'}]);
     * ```
     */
    invalidateTags: TagTypes extends readonly [] ? (tags?: any[]) => void : (tags?: TagTypes[number][]) => void;
  };
};


/**
 * Builder helper for creating query and mutation endpoints.
 * Passed as parameter to the endpoints factory function in createApi.
 * 
 * @template TagTypes - Union type of cache tag strings
 * 
 * @example
 * ```typescript
 * const api = createApi({
 *   baseQuery,
 *   tagTypes: ['users', 'posts'] as const,
 *   endpoints: (builder) => ({
 *     getUser: builder.query({
 *       query: ({id}) => `/users/${id}`,
 *       providesTags: ['users'],
 *       onSuccess: (data) => console.log('User fetched:', data)
 *     }),
 *     createPost: builder.mutation({
 *       query: (post) => ({
 *         url: '/posts',
 *         method: 'POST',
 *         body: post
 *       }),
 *       invalidateTags: ['posts']
 *     })
 *   })
 * });
 * ```
 */
export type BuilderType<TagTypes extends readonly string[] = readonly []> = {
  /**
   * Create a read-only query endpoint for data fetching.
   * 
   * @param config - Configuration including query function and options
   * @returns Query endpoint definition
   */
  query<Result, Arg = void>(
    config:{
      query?: (arg: Arg) => QueryFnReturn
    } & ApiOptionQuery<Arg, Result, TagTypes>
  ): QueryDef<Arg, Result, TagTypes>;
  
  /**
   * Create a write operation mutation endpoint.
   * 
   * @param config - Configuration including query function and options
   * @returns Mutation endpoint definition
   */
  mutation<Result, Arg = void>(
    config: {
      query?: (arg: Arg) => QueryFnObj
    } & ApiOptionMutation<Arg, Result>
  ):MutationDef<Arg, Result, TagTypes>;
};

/** @internal Base query return type with discriminated union for success/error */
type BaseQueryReturn<Data = any, Error = any> = | { data: Data; error?: undefined } | { data?: undefined; error: Error };

/**
 * Parameters for createApi function.
 * Configures the API with base query, endpoints, caching, middleware, and plugins.
 * 
 * @template T - Endpoints map type
 * @template TagTypes - Cache tag type tuple
 * 
 * @example
 * ```typescript
 * const api = createApi<typeof api, ['users', 'posts']>({
 *   baseQuery: async (queryArg) => {
 *     try {
 *       const result = await fetch(queryArg).then(r => r.json());
 *       return { data: result };
 *     } catch (error) {
 *       return { error: error.message };
 *     }
 *   },
 *   tagTypes: ['users', 'posts'] as const,
 *   cacheTimeout: 5 * 60 * 1000, // 5 minutes
 *   endpoints: (builder) => ({
 *     getUser: builder.query({
 *       query: ({id}) => `/users/${id}`,
 *       providesTags: ['users']
 *     })
 *   }),
 *   middlewares: [loggerMiddleware],
 *   plugins: [persistencePlugin]
 * });
 * ```
 */
export interface CreateApiParams<T extends EndpointsMap<TagTypes>, TagTypes extends readonly string[] = readonly []> {
  /**
   * HTTP client function that executes requests.
   * Receives QueryFnReturn and returns success/error response.
   */
  baseQuery: (option: QueryFnReturn) => Promise<BaseQueryReturn>;
  
  /**
   * Factory function that creates all endpoint definitions.
   * Receives builder with query and mutation helpers.
   */
  endpoints: (builder: BuilderType<TagTypes>) => T;
  
  /**
   * How long to cache query results in milliseconds.
   * Default: 5 minutes (300000ms).
   * @default 300000
   */
  cacheTimeout?: number;
  
  /**
   * Global middleware applied to all endpoints.
   * Executed before individual endpoint middleware.
   */
  middlewares?: ApiMiddleware[];
  
  /**
   * Global plugins with lifecycle hooks.
   * Executed for all query and mutation operations.
   */
  plugins?: ApiPlugin[];
  
  /**
   * Cache tag types used for cache invalidation.
   * Must match tags in providesTags and invalidateTags.
   * @example
   * ```typescript
   * tagTypes: ['users', 'posts', 'comments'] as const
   * ```
   */
  tagTypes?: TagTypes;
}



/**
 * Internal query store state combining hook result and control functions.
 * Tracks data, loading state, errors, and provides refetch capability.
 * 
 * @template T - Type of query result data
 * @internal Internal implementation detail
 */
export type QueryStore<T> =  QueryHookResult<T> & {
  /** Execute the query with given arguments */
  query: (arg:any) => MainQueryReturnTypes
  /** Manually refetch the query data */
  reFetch?: () => MainQueryReturnTypes
}

/**
 * Options passed to query hooks for behavior control.
 * 
 * @example
 * ```typescript
 * // Skip loading the query initially
 * const {data} = useGetUserQuery({id: 1}, {skip: true});
 * 
 * // Later trigger the query
 * const {data, reFetch} = useGetUserQuery({id: 1}, {skip: false});
 * if (data) {
 *   await reFetch();
 * }
 * ```
 */
export interface QueryHookOption {
  /** If true, skips executing the query */
  skip: boolean
}

/**
 * Context object passed to middleware functions.
 * Contains query arguments, endpoint definition, and store access.
 * 
 * @example
 * ```typescript
 * const loggingMiddleware: ApiMiddleware = async (ctx, next) => {
 *   console.log('Query starting:', ctx.arg);
 *   const result = await next();
 *   console.log('Query finished:', result);
 *   return result;
 * };
 * ```
 */
export type MiddlewareContext = {
  /** Arguments passed to the query or mutation */
  arg: any;
  /** The endpoint definition */
  def: any;
  /** Store getter function */
  get: any;
  /** Store setter function */
  set: any;
};

/**
 * Middleware function type for intercepting and modifying requests/responses.
 * Similar to Express middleware with async/await support.
 * 
 * Middlewares execute in pipeline order and can:
 * - Transform requests before execution
 * - Intercept responses
 * - Handle errors
 * - Add logging or monitoring
 * 
 * @example
 * ```typescript
 * const authMiddleware: ApiMiddleware = async (ctx, next) => {
 *   // Add auth token before request
 *   const authToken = localStorage.getItem('token');
 *   
 *   const result = await next();
 *   
 *   // Check for auth errors
 *   if (result.error?.status === 401) {
 *     // Handle unauthorized
 *     localStorage.removeItem('token');
 *   }
 *   
 *   return result;
 * };
 * ```
 */
export type ApiMiddleware = (
  ctx: MiddlewareContext,
  next: () => Promise<{ data?: any; error?: any }>
) => Promise<{ data?: any; error?: any }>;

/**
 * Plugin object with lifecycle hooks for cross-cutting concerns.
 * Plugins execute at specific points in the query/mutation lifecycle.
 * 
 * @example
 * ```typescript
 * const analyticsPlugin: ApiPlugin = {
 *   name: 'analytics',
 *   beforeQuery: (ctx) => {
 *     gtag.event('api_call', {endpoint: ctx.def.name});
 *   },
 *   afterQuery: (result, ctx) => {
 *     gtag.event('api_response', {
 *       endpoint: ctx.def.name,
 *       success: !result.error
 *     });
 *   },
 *   onError: (error, ctx) => {
 *     gtag.event('api_error', {
 *       endpoint: ctx.def.name,
 *       error: error.message
 *     });
 *   }
 * };
 * ```
 */
export type ApiPlugin = {
  /** Unique identifier for the plugin */
  name: string;

  /**
   * Called once when the API is created.
   * Use for initialization and setup.
   */
  onInit?: (api: {
    baseQuery: any;
    endpoints: any;
  }) => void;

  /**
   * Called before executing a query or mutation.
   * Can perform setup tasks like loading UI state.
   */
  beforeQuery?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Middleware handler for intercepting requests/responses.
   * Executed in the middleware pipeline.
   */
  middleware?: ApiMiddleware;

  /**
   * Called after successful query or mutation execution.
   * Perfect for success notifications and logging.
   */
  afterQuery?: (
    result: any,
    ctx: PluginContext
  ) => void | Promise<void>;

  /**
   * Called when query or mutation encounters an error.
   * Use for error logging, notifications, or recovery.
   */
  onError?: (
    error: any,
    ctx: PluginContext
  ) => void | Promise<void>;
};

/**
 * Context object passed to plugin lifecycle hooks.
 * Contains execution context including arguments and store access.
 * 
 * @internal Used internally by plugin system
 */
export type PluginContext = {
  /** Arguments passed to the query or mutation */
  arg: any;
  /** The endpoint definition */
  def: any;
  /** Store getter function */
  get: any;
  /** Store setter function */
  set: any;
};
