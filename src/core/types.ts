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
