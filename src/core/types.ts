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
export type Listener = () => void;

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
export type CreateParamsType<T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T
) => T

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
export type SetSateParams<T> = Partial<T> | ((state: T) => Partial<T>)

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
export type Middleware<T> = (
  set: (partial: SetSateParams<T>) => void,
  get: () => T
) => (
  next: (partial: SetSateParams<T>) => void
) => (partial: SetSateParams<T>) => void;



