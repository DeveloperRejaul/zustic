import { coreFn } from "./core";
import { ApiMiddleware, ApiPlugin } from "./types";

/**
 * Main query function that orchestrates middleware execution and plugin hooks.
 * 
 * Execution flow:
 * 1. Execute beforeQuery hooks from plugins
 * 2. Execute middleware chain
 * 3. Call core function to fetch data
 * 4. Execute afterQuery hooks from plugins
 * 5. Handle global error hooks if error occurred
 * 
 * @param arg - Query arguments
 * @param set - State setter function
 * @param get - State getter function
 * @param def - Endpoint definition
 * @param baseQuery - Base query function
 * @param cashTimeout - Cache timeout in milliseconds
 * @param isRefetch - Force refetch flag
 * @param middlewares - Array of middleware functions to execute
 * @param plugins - Array of plugin objects with hooks
 * @returns Promise with query result containing data or error
 */
export async function queryFn (
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
      return coreFn(arg, set, get,def,baseQuery,cashTimeout, isRefetch);
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