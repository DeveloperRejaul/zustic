export type RequiredRule =
  | boolean
  | { value: boolean; message: string };

export type NumberRule =
  | number
  | { value: number; message: string };

export type Field <T>= {
  value: T
  error?: string | null
  required?: RequiredRule
  pattern?: { value: RegExp; message: string }
  min?:NumberRule
  max?: NumberRule
}

type ResolverResult<T> = {
  values?: T;
  errors?: Partial<Record<keyof T, string>>;
};

type Resolver<T> = (
  values: T
) => ResolverResult<T> | Promise<ResolverResult<T>>;

export interface HookFormParams<T> {
  defaultValues: {
    [K in keyof T]: Field<T[K]> | T[K];
  }
  resolver?: Resolver<T>;
}

export interface ControllerProps<T> {
  field: keyof T;
  render: (
    value: string, 
    error: string,
    onChange: (value: string) => void
  ) => React.ReactNode;
}

export type HandleSubmitType<T> = (cb: (data: T) => void) => (e: React.FormEvent<HTMLFormElement>) => void;