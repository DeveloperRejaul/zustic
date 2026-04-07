
export interface I18nParams<T, L> {
  initialLan: L;
  resorce: (lan: L) => Promise<T> | T;
}

/**
 * Recursively gets all nested keys from object using dot notation.
 * Safely handles deep nesting without infinite recursion.
 */
type Join<K extends string | number, P extends string | number> = 
  `${K}${'' extends P ? '' : `.${P}` }`;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ...0[]];

type NestedKeys<T, D extends number = 9> = 
  D extends never ? never :
  T extends object
    ? {
        [K in keyof T]-?: K extends string
          ? T[K] extends (infer U)[]
            ? K
            : T[K] extends object
              ? K | Join<K, NestedKeys<T[K], Prev[D]>>
              : K
          : never
      }[keyof T & string]
    : never;

export type TranslationKey<T> = NestedKeys<T> & string;
export type StoreType<T, L> = {
    lan: L
    update: (lan: L) => void
}
