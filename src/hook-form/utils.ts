import type { Field, NumberRule, RequiredRule } from "./type";

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
 * Gets the template field definition for an indexed array path.
 *
 * @param fieldKey - Normalized field path like `user[2].name`.
 * @param state - Current form state object.
 * @returns The template field for the same array index group, or undefined.
 */
export const getFieldTemplate = (
  fieldKey: string,
  state: Record<string, any>
): Field<any> | undefined => {
  return state[fieldKey.replace(/\[\d+\]/g, "[0]")] as Field<any> | undefined;
};

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

/**
 * Parses a nested field path into string and numeric tokens.
 *
 * @param path - Field path in dot/bracket format, e.g. `user.[0].name`.
 * @returns An array of segments, with numeric indices parsed as numbers.
 */
const parsePath = (path: string): Array<string | number> => {
  const tokens = path.match(/[^.\[\]]+/g) || [];
  return tokens.map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
};

/**
 * Normalizes a field path to the internal flattened key format.
 *
 * @param path - Field path in any supported string form.
 * @returns Flattened field key like `user[0].name`.
 */
export const normalizeFieldKey = (path: string): string => {
  const segments = parsePath(path);
  return segments.reduce<string>((acc, segment) => {
    const segmentString = String(segment);
    if (typeof segment === "number") {
      return `${acc}[${segmentString}]`;
    }
    return acc ? `${acc}.${segmentString}` : segmentString;
  }, "");
};

/**
 * Flattens nested default values into a key/value map used by the form store.
 *
 * @param values - Nested default value object or array structure.
 * @param basePath - Current path prefix while recursing.
 * @returns Flattened map of field values keyed by normalized string paths.
 */
const flattenDefaultValues = (values: any, basePath = "") => {
  const result: Record<string, any> = {};

  const assignField = (path: string, field: any) => {
    result[path] = {
      error: field.error ?? "",
      touched: field.touched ?? false,
      isDirty: field.isDirty ?? false,
      ...field,
    };

    const innerValue = field.value;
    if (innerValue && typeof innerValue === "object") {
      Object.assign(result, flattenDefaultValues(innerValue, path));
    }
  };

  if (Array.isArray(values)) {
    values.forEach((item, index) => {
      const path = basePath ? `${basePath}[${index}]` : `${index}`;

      if (item && typeof item === "object" && "value" in item) {
        assignField(path, item);
      } else if (typeof item === "object") {
        Object.assign(result, flattenDefaultValues(item, path));
      } else {
        assignField(path, { value: item });
      }
    });

    return result;
  }

  Object.entries(values || {}).forEach(([key, value]) => {
    const path = basePath ? `${basePath}.${key}` : key;

    if (value && typeof value === "object" && "value" in value) {
      assignField(path, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayPath = `${path}[${index}]`;
        if (item && typeof item === "object" && "value" in item) {
          assignField(arrayPath, item);
        } else if (typeof item === "object") {
          Object.assign(result, flattenDefaultValues(item, arrayPath));
        } else {
          assignField(arrayPath, { value: item });
        }
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.assign(result, flattenDefaultValues(value, path));
      return;
    }

    assignField(path, { value });
  });

  return result;
};

/**
 * Normalizes default values into the internal field structure used by the hook-form store.
 *
 * @template T - The target form values type.
 * @param defaultValues - Static or nested default values object.
 * @returns Normalized record of field configs keyed by flattened paths.
 *
 * @example
 * normalizeDefaultValues({ user: [{ name: 'Alice' }] });
 * // { 'user[0].name': { value: 'Alice', error: '' } }
 */
export function normalizeDefaultValues<T>(defaultValues: any) {
  return flattenDefaultValues(defaultValues) as Record<keyof T, any>;
}

/**
 * Converts a raw input value into the expected field type.
 *
 * @template T - Expected field value type.
 * @param value - Raw input value from a field event.
 * @param defaultValue - Default field value used to infer the target type.
 * @returns Parsed value coerced into the expected type.
 *
 * @example
 * parseValue('123', 0); // 123
 * parseValue('true', false); // true
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

/**
 * Converts a flattened field map into a nested object or array shape.
 *
 * @template T - Target nested type.
 * @param values - Flattened values keyed by string paths.
 * @returns Nested object with arrays reconstructed from bracket notation.
 */
export const unflattenValues = <T>(values: Record<string, any>): T => {
  let result: any = {};

  Object.entries(values).forEach(([path, value]) => {
    const segments = parsePath(path);
    if (segments.length === 0) return;

    if (typeof segments[0] === "number" && Array.isArray(result) === false && Object.keys(result).length === 0) {
      result = [];
    }

    let current: any = result;

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      const nextSegment = segments[index + 1];
      const nextIsNumber = typeof nextSegment === "number";
      const shouldBeArray = typeof segment === "number" || nextIsNumber;

      if (isLast) {
        current[segment] = value;
        return;
      }

      if (!(segment in current)) {
        current[segment] = shouldBeArray ? [] : {};
      }

      current = current[segment];
    });
  });

  return result as T;
};

/**
 * Compares two validation rule values or objects for equality.
 *
 * @param a - First rule value or rule object.
 * @param b - Second rule value or rule object.
 * @returns True when both inputs are deeply equal for rule comparison.
 */
const isRuleEqual = (a: any, b: any) => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    return a.value === b.value && a.message === b.message;
  }
  return false;
};

/**
 * Compares two pattern rule objects for equality.
 *
 * @param a - First pattern rule to compare.
 * @param b - Second pattern rule to compare.
 * @returns True when both patterns have the same regex and message.
 */
const isPatternEqual = (
  a?: { value: RegExp; message: string },
  b?: { value: RegExp; message: string }
) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.message === b.message && a.value.source === b.value.source && a.value.flags === b.value.flags;
};

/**
 * Compares two field state objects for equality.
 *
 * @param a - First field state to compare.
 * @param b - Second field state to compare.
 * @returns True when field value, metadata and validation rules are equal.
 */
const areFieldStatesEqual = (a: Field<any>, b: Field<any>) => {
  return a.value === b.value &&
    a.error === b.error &&
    a.touched === b.touched &&
    a.isDirty === b.isDirty &&
    isRuleEqual(a.required, b.required) &&
    isPatternEqual(a.pattern, b.pattern) &&
    isRuleEqual(a.min, b.min) &&
    isRuleEqual(a.max, b.max);
};

/**
 * Compares normalized default form values to detect when props have changed.
 *
 * @param prev - Previous normalized default values or null.
 * @param next - Current normalized default values.
 * @returns True when the default value structure is unchanged.
 */
export const areDefaultValuesEqual = (
  prev: Record<keyof any, Field<any>> | null,
  next: Record<keyof any, Field<any>>
) => {
  if (prev === next) return true;
  if (!prev) return false;

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every((key) =>
    nextKeys.includes(key) &&
    areFieldStatesEqual(prev[key as keyof any] as Field<any>, next[key as keyof any] as Field<any>)
  );
};


 /**
  * Resolves form default values from a static object or a callback function.
  *
  * Supports dynamic default values based on parameters passed to the form hook.
  * If `defaultValues` is a function, it will be executed with the provided props.
  * The result is normalized into the internal field structure used by the form.
  *
  * @template T - Form values type.
  * @template P - Parameters type passed to the form hook.
  *
  * @param defaultValues - Static default values object or function returning default values.
  * @param props - Parameters provided when calling the form hook.
  *
  * @returns Normalized form field state containing value and validation metadata.
  *
  * @example
  * const fields = getDefaultValues(
  *   ({ user }) => ({
  *     name: user.name,
  *     email: user.email
  *   }),
  *   {
  *     user: {
  *       name: "John",
  *       email: "john@example.com"
  *     }
  *   }
  * );
  */
export const getDefaultValues = (defaultValues: any,props: any) => {
  const values =
    typeof defaultValues === "function"
      ? defaultValues(props)
      : defaultValues;

  return normalizeDefaultValues(values);
};