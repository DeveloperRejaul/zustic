/**
 * Capitalizes the first character of a string.
 * @param str - The string to capitalize
 * @returns The capitalized string
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Creates a unique cache key for an API endpoint and arguments.
 * Uses the endpoint name and stringified arguments to create a deterministic key.
 * 
 * @param endpoint - The endpoint name (e.g., 'getUser', 'createPost')
 * @param arg - The arguments passed to the endpoint
 * @returns A unique cache key combining endpoint and arguments
 * @example
 * createCacheKey('getUser', {id: 1}) // 'getUser__{"id":1}'
 */
export function createCacheKey(endpoint: string, arg: any) {
  return `${endpoint}__${JSON.stringify(arg ?? {})}`;
}

