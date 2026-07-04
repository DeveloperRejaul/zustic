import type { NumberRule, RequiredRule } from "./type";

/**
 * Capitalizes the first character of a string.
 *
 * @param str - The string to capitalize
 * @returns The capitalized string
 *
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Normalizes the `required` rule for a field.
 *
 * Supports `boolean` or `{ value: boolean; message: string }` form.
 *
 * @param rule - The required rule to normalize
 * @param field - The name of the field (used in default error messages)
 * @returns Normalized required rule
 *
 * @example
 * getRequired(true, 'email')
 * // { value: true, message: '' }
 *
 * getRequired(false, 'email')
 * // { value: false, message: 'Email is required' }
 */
export function getRequired(rule: RequiredRule | undefined, field: string) {

  if (!rule) {
    return { 
      value: false,
      message: "" 
    };
  } 

  if (typeof rule === "boolean") {
    return {
      value: rule,
      message: rule ? `${capitalize(field)} is required`: "",
    };
  }

  return rule;
}

/**
 * Normalizes numeric validation rules (`min` / `max`) for a field.
 *
 * Supports either a number or `{ value: number; message: string }`.
 *
 * @param rule - Numeric rule to normalize
 * @param type - "min" or "max", used for default messages
 * @returns Normalized number rule or null if undefined
 *
 * @example
 * getNumberRule(5, 'min')
 * // { value: 5, message: 'Minimum is 5' }
 *
 * getNumberRule({ value: 10, message: 'Too high' }, 'max')
 * // { value: 10, message: 'Too high' }
 */
export function getNumberRule(rule: NumberRule | undefined, type: "min" | "max") {
  if (rule === undefined) return null;

  if (typeof rule === "number") {
    return {
      value: rule,
      message: type === "min" ? `Minimum is ${rule}` : `Maximum is ${rule}`,
    };
  }

  return rule;
}

/**
 * Extracts plain values from the form state.
 *
 * @template T - Type of form values
 * @param state - The form state object containing fields with `.value`
 * @returns An object with only the field values
 *
 * @example
 * const state = { email: { value: 'a@b.com' }, password: { value: '123' } };
 * getValues<{ email: string, password: string }>(state);
 * // { email: 'a@b.com', password: '123' }
 */
export function getValues<T>(state: any): T {
  const result = {} as T;

  Object.keys(state || {}).forEach((key) => {
    const item = state[key];
    if (typeof item === "object" && "value" in item) {
      result[key as keyof T] = item.value;
    }
  });

  return result;
}

/**
 * Creates a Zod resolver for form validation.
 *
 * @param schema - Zod schema object
 * @returns A resolver function that takes values and returns { values, errors }
 *
 * @example
 * const resolver = zodResolver(schema);
 * const result = resolver({ email: 'test@test.com' });
 * // { values: { email: 'test@test.com' } }
 */
export const zodResolver = (schema: any) => (values: any) => {
  const result = schema.safeParse(values);

  if (result.success) {
    return { values: result.data };
  }

  const errors: Record<string, string> = {};

  result.error.issues.forEach((err: any) => {
    const key = err.path[0];
    errors[key] = err.message;
  });

  return { errors };
};

/**
 * Creates a Yup resolver for form validation.
 *
 * @param schema - Yup schema object
 * @returns An async resolver function that takes values and returns { values, errors }
 *
 * @example
 * const resolver = await yupResolver(schema)(values);
 * // { values: {...} } or { errors: {...} }
 */
export const yupResolver = (schema: any) => async (values: any) => {
  try {
    const data = await schema.validate(values, { abortEarly: false });
    return { values: data };
  } catch (err: any) {
    const errors: Record<string, string> = {};

    err.inner.forEach((e: any) => {
      errors[e.path] = e.message;
    });

    return { errors };
  }
};


export function normalizeDefaultValues<T>(defaultValues: any) {
  const result: any = {};

  Object.keys(defaultValues).forEach((key) => {
    const value = defaultValues[key];

    // already Field object
    if (value && typeof value === "object" && "value" in value) {
      result[key] = {
        error: "",
        ...value,
      };
    } else {
      // primitive → convert to Field
      result[key] = {
        value,
        error: "",
      };
    }
  });

  return result as Record<keyof T, any>;
}


/**
 * Converts a string value to the expected type based on T
 * @param value - The raw input (usually string from input field)
 * @param defaultValue - The default value to infer the type
 */
export function parseValue<T>(value: any, defaultValue: T): T {
  if (typeof defaultValue === "number") {
    const parsed = Number(value);
    return (isNaN(parsed) ? 0 : parsed) as unknown as T;
  }

  if (typeof defaultValue === "boolean") {
    return Boolean(value) as unknown as T;
  }

  // fallback: string or other types
  return value as T;
}