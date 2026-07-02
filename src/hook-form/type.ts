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
export type RequiredRule =
  | boolean
  | { value: boolean; message: string };

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
export type NumberRule =
  | number
  | { value: number; message: string };

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
export type Field <T>= {
  value: T
  error?: string | null
  touched?: boolean
  isDirty?: boolean
  required?: RequiredRule
  pattern?: { value: RegExp; message: string }
  min?:NumberRule
  max?: NumberRule
}

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
type Resolver<T extends Record<string, any>> = (
  values: T
) => ResolverResult<T> | Promise<ResolverResult<T>>;

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
export interface HookFormParams<T extends Record<string, any>> {
  defaultValues: {
    [K in keyof T]: Field<T[K]> | T[K];
  }
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
export interface ControllerProps<T extends Record<string, any>> {
  field: keyof T;
  render: (field:{value: any, 
    error: string,
    onChange: (value: string) => void,
  }) => React.ReactNode;
}

/**
 * Form state structure containing all field states and methods.
 * Contains all form field states plus utility methods for form management,
 * validation, error handling, and state tracking.
 * 
 * @template T - Type of form values (must be an object)
 * 
 * @property [field] - All form fields with their states (Field<T[K]>)
 * @property setFieldValue - Update field value with type conversion
 * @property setValue - Type-safe field value setter
 * @property defaultValidateField - Validate using built-in rules
 * @property resolverValidate - Validate using custom resolver
 * @property handleSubmit - Form submission handler
 * @property getValues - Get form values or specific field
 * @property setError - Manually set field error
 * @property getErrors - Get all/specific field errors
 * @property clearFieldError - Clear single field error
 * @property clearAllErrors - Clear all field errors
 * @property isDirty - Check if form/field has been modified
 * @property isTouched - Check if field has been focused
 * @property setTouched - Set field touched state
 * @property reset - Reset form to initial state
 * 
 * @example
 * const { setFieldValue, watch, handleSubmit } = form();
 * 
 * // Update field
 * setFieldValue('email', 'user@example.com');
 * 
 * // Get field value
 * const email = watch('email');
 * 
 * // Handle submission
 * <form onSubmit={handleSubmit((data) => console.log(data))}>
 */
export  type FormState<T> = Record<keyof T, Field<T[keyof T]>> & {
  setFieldValue: (field: keyof T, value: any) => void;
  defaultValidateField: (field: keyof T) => string;
  resolverValidate: (field: keyof T) => Promise<string | undefined>;
  handleSubmit: (cb: (data: T) => void) => (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  getValues: (key?: keyof T) => T | T[keyof T];
  setValue: (key: keyof T, value: T[keyof T]) => void;
  setError: (field: keyof T, error: string) => void;
  getErrors: (key?: keyof T) => Partial<Record<keyof T, string>> | string;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  isDirty: (field?: keyof T) => boolean;
  isTouched: (field: keyof T) => boolean;
  setTouched: (field: keyof T, touched: boolean) => void;
  reset: () => void;
};

/**
 * Form submission handler type.
 * Returns a function that accepts form submission event and prevents default behavior.
 * Validates all fields before calling the callback with valid data.
 * 
 * @template T - Type of form values
 * @param callback - Function that receives validated form data
 * @returns Event handler for form onSubmit
 * 
 * @example
 * // Usage
 * const handleSubmit = handleSubmit((data) => {
 *   console.log('Valid form data:', data);
 * });
 * 
 * // In JSX - pass to form onSubmit
 * // <form onSubmit={handleSubmit}>...</form>
 */
export type HandleSubmitType<T extends Record<string, any>> = (cb: (data: T) => void) => (e: React.FormEvent<HTMLFormElement>) => void;
