/**
 * Function signature for store state change listeners.
 * Called whenever the store state changes.
 *
 * @example
 * ```typescript
 * const listener: Listener = () => {
 *   console.log('Store state changed!');
 * };
 *
 * store.subscribe(listener);
 * ```
 */
type Listener = () => void;
/**
 * Store creation function signature.
 * Initializes store state and returns the initial state value.
 *
 * The function receives set and get utilities to manage state:
 * - `set` updates partial state or via updater function
 * - `get` retrieves current state
 *
 * @template T - Type of store state
 *
 * @example
 * ```typescript
 * type CounterState = {count: number; increment: () => void};
 *
 * const useCounter = create<CounterState>((set, get) => ({
 *   count: 0,
 *   increment: () => set({count: get().count + 1})
 * }));
 * ```
 */
type CreateParamsType<T> = (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T;
/**
 * State update parameter type.
 * Can be either a partial state object or an updater function.
 * Provides flexibility for both shallow and computed updates.
 *
 * @template T - Type of store state
 *
 * @example
 * ```typescript
 * // Partial object update
 * set({count: 5});
 *
 * // Updater function
 * set((state) => ({count: state.count + 1}));
 * ```
 */
type SetSateParams<T> = Partial<T> | ((state: T) => Partial<T>);
/**
 * Middleware function type for intercepting state updates.
 * Follows higher-order function pattern for composability.
 *
 * Middlewares can:
 * - Log state changes
 * - Persist state to storage
 * - Validate state updates
 * - Handle side effects
 *
 * @template T - Type of store state
 *
 * @example
 * ```typescript
 * // Logger middleware
 * const logger: Middleware<CounterState> = (set, get) => (next) => (partial) => {
 *   console.log('Updating from:', get());
 *   next(partial);
 *   console.log('Updated to:', get());
 * };
 *
 * // Persistence middleware
 * const persist: Middleware<CounterState> = (set, get) => (next) => (partial) => {
 *   next(partial);
 *   localStorage.setItem('state', JSON.stringify(get()));
 * };
 *
 * // Use with store
 * const useCounter = create(
 *   (set, get) => ({count: 0}),
 *   compose(logger, persist)
 * );
 * ```
 */
type Middleware<T> = (set: (partial: SetSateParams<T>) => void, get: () => T) => (next: (partial: SetSateParams<T>) => void) => (partial: SetSateParams<T>) => void;

/**
 * Create a store with state and actions.
 *
 * Example usage:
 * ```ts
 * type CreateType = {
 *   count: number;
 *   inc: () => void;
 *   dec: () => void;
 * }
 *
 * export const useCounter = create<CreateType>((set) => ({
 *   count: 1,
 *   inc: () => set((state) => ({ count: state.count + 1 })),
 *   dec: () => set((state) => ({ count: state.count - 1 })),
 * }));
 *
 * // In a React component:
 * const Counter = () => {
 *   const { count, inc, dec } = useCounter();
 *   return (
 *     <>
 *       <Text>{count}</Text>
 *       <Button title="+" onPress={inc} />
 *       <Button title="-" onPress={dec} />
 *     </>
 *   );
 * }
 * ```
 *
 * Example of Middleware
 * ```
 * const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
 *     console.log('prev:', get());
 *     await next(partial);
 *     console.log('next:', get());
 * };
 *
 * ```
 *
 * @param initializer Function that receives `set` and returns the initial state object.
 * @returns A hook that provides access to the store state and actions.
 */
declare function create<T extends object>(initializer: CreateParamsType<T>, middlewares?: Middleware<T>[]): {
    <U = T>(selector?: (state: T) => U): U;
    getState: () => T;
    setState: (partial: SetSateParams<T>) => void;
    subscribe: (listener: Listener) => () => void;
};

export { type Middleware, create };
