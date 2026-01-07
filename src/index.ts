'use client';
import { useSyncExternalStore } from 'react';

type Listener = () => void;


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
 * })));
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
 * @param initializer Function that receives `set` and returns the initial state object.
 * @returns A hook that provides access to the store state and actions.
 */
export function create<T extends object>(initializer: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void) => T) {
  // Internal store state
  let state: T;
  let listeners: Listener[] = [];

  // Update function
  const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const partialState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...partialState };
    listeners.forEach(l => l());
  };

  // Create store
  state = initializer(setState);

  // Subscribe function
  const subscribe = (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  const getSnapshot = () => state;

  // React hook
  return function useStore() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot);
    return snapshot;
  };
}



