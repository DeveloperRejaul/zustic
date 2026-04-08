export type RequiredRule =
  | boolean
  | { value: boolean; message: string };

export type NumberRule =
  | number
  | { value: number; message: string };

export type Field = {
  value: string
  error?: string | null
  required?: RequiredRule
  pattern?: { value: RegExp; message: string }
  min?:NumberRule
  max?: NumberRule
}

export type FormStore<T> = {
    [K in keyof T]: Field | T[K];
}&{
 setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
}

export interface HookFormParams<T>{
    defaultValues: {
        [K in keyof T]: Field | T[K];
    };
    resolver?: (values: T) => {
      values?: T;
      errors?: Partial<Record<keyof T, string>>;
    };
}
