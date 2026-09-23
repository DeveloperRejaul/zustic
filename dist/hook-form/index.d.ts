import React$1 from 'react';

/**
 * Required field validation rule.
 * Can be a simple boolean or an object with custom error message.
 *
 * @example
 * // Simple required
 * required: true
 *
 * // With custom message
 * required: { value: true, message: "Email is required" }
 */
type RequiredRule = boolean | {
    value: boolean;
    message: string;
};
/**
 * Numeric validation rule for min/max constraints.
 * Can be a plain number or an object with custom error message.
 *
 * @example
 * // Simple min value
 * min: 18
 *
 * // With custom message
 * min: { value: 18, message: "Must be 18 or older" }
 */
type NumberRule = number | {
    value: number;
    message: string;
};
/**
 * Individual form field state and configuration.
 * Tracks value, error, validation rules, and user interaction state.
 *
 * @template T - The type of the field value
 *
 * @property value - Current field value
 * @property error - Current error message (if any)
 * @property touched - Whether field has been focused/interacted with
 * @property isDirty - Whether field has been modified from initial value
 * @property required - Required validation rule
 * @property pattern - Regex pattern for string validation
 * @property min - Minimum value or length
 * @property max - Maximum value or length
 *
 * @example
 * const emailField: Field<string> = {
 *   value: "",
 *   error: null,
 *   touched: false,
 *   isDirty: false,
 *   required: { value: true, message: "Email is required" },
 *   pattern: {
 *     value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
 *     message: "Invalid email format"
 *   }
 * }
 */
type Field<T> = {
    value: T;
    error?: string | null;
    touched?: boolean;
    isDirty?: boolean;
    required?: RequiredRule;
    pattern?: {
        value: RegExp;
        message: string;
    };
    min?: NumberRule;
    max?: NumberRule;
};
/**
 * Validation resolver result containing validated values and errors.
 * Used as return type for custom validation resolvers (Zod, Yup, etc).
 *
 * @template T - Type of form values
 * @property values - Validated values if validation passes
 * @property errors - Object containing field-level errors if validation fails
 *
 * @example
 * // Successful validation
 * { values: { email: "user@example.com", age: 25 } }
 *
 * // Failed validation
 * { errors: { email: "Invalid email", age: "Must be 18+" } }
 */
type ResolverResult<T extends Record<string, any>> = {
    values?: T;
    errors?: Partial<Record<keyof T, string>>;
};
/**
 * Custom validation resolver function for external validation libraries.
 * Can be synchronous or asynchronous.
 *
 * @template T - Type of form values
 * @param values - Current form values to validate
 * @returns Validation result with values or errors
 *
 * @example
 * // Zod resolver
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 *
 * const resolver = async (values) => {
 *   const result = schema.safeParse(values);
 *   if (result.success) {
 *     return { values: result.data };
 *   }
 *   const errors = {};
 *   result.error.issues.forEach(issue => {
 *     errors[issue.path[0]] = issue.message;
 *   });
 *   return { errors };
 * };
 */
type Resolver<T extends Record<string, any>> = (values: T) => ResolverResult<T> | Promise<ResolverResult<T>>;
/**
 * Configuration parameters for form creation.
 * Defines initial values and optional custom validation.
 *
 * @template T - Type of form values (must be an object)
 * @property defaultValues - Initial field values with optional validation rules
 * @property resolver - Optional custom validation function (Zod, Yup, etc)
 *
 * @example
 * const params: HookFormParams<{ email: string; age: number }> = {
 *   defaultValues: {
 *     email: {
 *       value: "",
 *       required: { value: true, message: "Email is required" }
 *     },
 *     age: { value: 0, min: 18 }
 *   },
 *   resolver: zodResolver(schema)
 * }
 */
type DefaultValues<T> = T extends Array<infer U> ? Array<DefaultValues<U>> : T extends object ? {
    [K in keyof T]: DefaultValues<T[K]> | Field<T[K]>;
} : Field<T> | T;
interface HookFormParams<T extends Record<string, any>, P extends Record<string, any> = {}> {
    defaultValues: DefaultValues<T> | ((props: P) => DefaultValues<T>);
    resolver?: Resolver<T>;
}
/**
 * Props for the Controller component.
 * Configures controlled input rendering and additional input properties.
 *
 * @template T - Type of form values
 * @property field - The field name being controlled
 * @property render - Function that renders the input element with form props
 * @property autoFocus - Auto-focus this input on mount
 * @property onBlur - Custom callback when input loses focus
 *
 * @example
 * const props: ControllerProps<FormData> = {
 *   field: "email",
 *   onBlur: () => console.log("Email field blurred"),
 *   render: (field) => (
 *     <input
 *       value={field.value}
 *       onChange={(e) => field.onChange(e.target.value)}
 *       ref={field.ref}
 *       disabled={field.disabled}
 *     />
 *   )
 * }
 */
interface ControllerProps<T extends Record<string, any>> {
    field: keyof T;
    render: (field: {
        value: T[keyof T];
        error: string;
        onChange: (value: T[keyof T]) => void;
    }) => React.ReactNode;
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
declare const zodResolver: (schema: any) => (values: any) => {
    values: any;
    errors?: undefined;
} | {
    errors: Record<string, string>;
    values?: undefined;
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
declare const yupResolver: (schema: any) => (values: any) => Promise<{
    values: any;
    errors?: undefined;
} | {
    errors: Record<string, string>;
    values?: undefined;
}>;

/**
 * Creates a type-safe form with validation, state management, and controller components.
 * Supports both built-in validation and custom resolvers (Zod, Yup).
 *
 * @template T - Form values type (must be an object)
 * @param params - Form configuration
 * @param params.defaultValues - Default field values with optional validation rules
 * @param params.resolver - Optional custom validation resolver (Zod or Yup)
 * @returns A hook function that returns form methods and Controller component
 *
 * @example
 * // Using built-in validation
 * const form = createForm<{ email: string; age: number }>({
 *   defaultValues: {
 *     email: {
 *       value: "",
 *       required: { value: true, message: "Email is required" },
 *       pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
 *     },
 *     age: {
 *       value: 0,
 *       required: true,
 *       min: { value: 18, message: "Must be 18+" }
 *     }
 *   }
 * });
 *
 * const { handleSubmit, Controller } = form();
 *
 * // In your component:
 * // <form onSubmit={handleSubmit((data) => console.log(data))}>
 * //   <Controller
 * //     field="email"
 * //     render={(value, error, onChange) => (
 * //       <div>
 * //         <input value={value} onChange={(e) => onChange(e.target.value)} />
 * //         {error && <span>{error}</span>}
 * //       </div>
 * //     )}
 * //   />
 * // </form>
 *
 * @example
 * // Using Zod resolver
 * import { z } from 'zod';
 * import { zodResolver } from './index';
 *
 * const schema = z.object({
 *   email: z.string().email("Invalid email"),
 *   password: z.string().min(8, "Min 8 characters")
 * });
 *
 * const form = createForm({
 *   defaultValues: {
 *     email: "",
 *     password: ""
 *   },
 *   resolver: zodResolver(schema)
 * });
 */
declare function createForm<T extends Record<string, any>, P extends Record<string, any> = T>(params: HookFormParams<T, P>): (props?: P) => {
    handleSubmit: (cb: (data: T) => void) => (e: React$1.FormEvent<HTMLFormElement>) => Promise<void>;
    Controller: ({ field, render }: ControllerProps<T>) => React$1.ReactNode;
    setValue: (key: string | keyof T, value: T[keyof T]) => void;
    getValues: (key?: string | keyof T | undefined) => T | T[keyof T];
    getErrors: (key?: string | keyof T | undefined) => Partial<Record<string, string>> | string;
    setError: (field: string | keyof T, error: string) => void;
    reset: () => void;
    watch: (key: keyof T | string) => any;
    setTouched: (field: string | keyof T, touched: boolean) => void;
    isDirty: (field?: string | keyof T | undefined) => boolean;
    clearAllErrors: () => void;
    clearFieldError: (field: string | keyof T) => void;
};

export { createForm, yupResolver, zodResolver };
