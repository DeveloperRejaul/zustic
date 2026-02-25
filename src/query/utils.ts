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


// Helper function to check if a query tag matches an invalidation tag
export function tagMatches (invalidTag: any, queryTag: any): boolean {
    const isInvalidTagString = typeof invalidTag === 'string';
    const isQueryTagString = typeof queryTag === 'string';

    // String invalidation tag matches string query tag
    if (isInvalidTagString && isQueryTagString) {
      return invalidTag === queryTag;
    }

    // Object invalidation tag matches object query tag by type (and optionally by id)
    if (!isInvalidTagString && !isQueryTagString) {
      const typeMatch = invalidTag.type === queryTag.type;
      const idMatch = !invalidTag.id || invalidTag.id === queryTag.id;
      return typeMatch && idMatch;
    }

    // String tag does NOT match object tag (different formats)
    // Object tag does NOT match string tag (different formats)
    return false;
};



