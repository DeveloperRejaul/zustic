'use client';
import { useSyncExternalStore } from 'react';
import type { CreateParamsType, Listener, Middleware, SetSateParams } from './types';

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
function create<T extends object>(
  initializer: CreateParamsType<T>,
  middlewares: Middleware<T>[] = []
) {
  // Internal store state
  let state: T;
  let listeners: Listener[] = [];

  // Update function
  const setState = (partial: SetSateParams<T>) => {
    const partialState = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...partialState };
    listeners.forEach(l => l());
  };

  const getState = () => state;

  // setState with Middleware
  const setStateWithMiddleware = applyMiddleware<T>(setState,getState,middlewares);


  // Create store
  state = initializer(setStateWithMiddleware, getState);


  // Subscribe function
  const subscribe = (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };


  // React hook
  return () => useSyncExternalStore(subscribe, getState)
}


const applyMiddleware = <T>(
  set: (partial: SetSateParams<T>) => void,
  get: () => T,
  middlewares?: Middleware<T>[]
):((partial: SetSateParams<T>) => void) => {
  if (!middlewares || middlewares.length === 0) {
    return set;
  }

  return middlewares.reduceRight((next, mw) => mw(set, get)(next),set);
};

export {
    create
}