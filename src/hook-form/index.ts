'use client';

import { create } from "core";
import React from "react";
import { getNumberRule, getRequired, getValues as gv, normalizeDefaultValues, parseValue, yupResolver, zodResolver } from "./utils";
import type { ControllerProps, HookFormParams, Field ,FormState} from "./type";


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

function createForm<T extends Record<string, any>>(params: HookFormParams<T>) {
    const { defaultValues, resolver } = params;
    const fd: Record<keyof T, Field<T[keyof T]>> = normalizeDefaultValues(defaultValues);
    
    const useForm = create<FormState<T>>((set, get) => ({
        ...fd,
        /**
         * Updates a single field value and casts it to the correct type.
         * 
         * @param field - The field name to update
         * @param value - The new value (typically from input)
         * 
         * @example
         * setFieldValue('email', 'user@example.com');
         * setFieldValue('age', '25');  // Automatically converted to number
         */
        setFieldValue: (field: keyof T, value: any): void => {
            const fieldState = get()[field];
            set({
                [field]: {
                    ...fieldState,
                    value: parseValue<T[keyof T]>(value, fd[field]?.value)
                }
            } as any);
        },
        /**
         * Validates a single field using built-in validation rules.
         * Checks: required, pattern, min, max
         * 
         * @param field - The field name to validate
         * @returns Error message if validation fails, empty string otherwise
         * 
         * @example
         * const error = defaultValidateField('email');
         * if (error) console.log(error);  // 'Email is required'
         */
        defaultValidateField: (field: keyof T): string => {
            const state = get();
            const fieldState = state[field] as Field<T[keyof T]>;
            let error: string = "";
            const value = parseValue<T[keyof T]>(fieldState.value, fieldState.value);

            const required = getRequired(fieldState.required, String(field));
            const min = getNumberRule(fieldState.min, "min");
            const max = getNumberRule(fieldState.max, "max");

            // handle required
            if (required.value && !value) {
                error = required.message;
            }            
            // pattern
            else if (typeof value === "string" && fieldState.pattern && !fieldState.pattern.value.test(value)) {
                error = fieldState.pattern.message;
            }

            // min
            else if (min && ((typeof value === "string" && value.length < min.value) || (typeof value === "number" && value < min.value))) {
                error = min.message;
            }

            // max
            else if (max && ((typeof value === "string" && value.length > max.value) || (typeof value === "number" && value > max.value))) {
                error = max.message;
            }
            
            set({
                [field]: {
                    ...fieldState,
                    error,
                }
            } as any);

            return error;
        },
        /**
         * Validates a field using the custom resolver (Zod, Yup, etc).
         * Only runs if a resolver was provided in createForm params.
         * 
         * @param field - The field name to validate
         * @returns Promise that resolves to error message if validation fails
         * 
         * @example
         * const error = await resolverValidate('email');
         * if (error) console.log(error);  // 'Must be valid email'
         */
        resolverValidate: async (field: keyof T): Promise<string | undefined> => {
            if (!resolver) return undefined;

            const state = get();
            const fieldState = state[field] as Field<T[keyof T]>;
            let error: string = "";
            const values = gv<T>(state as any);
            const result = await resolver(values);
            
            if (result?.errors) {
                const err = (result.errors as any)[field];
                if (err) error = err;
            }

            set({
                [field]: {
                    ...fieldState,
                    error,
                },
            } as any);
            
            return error;
        },
        /**
         * Validates all fields and calls callback if no errors.
         * Uses resolver if available, otherwise uses built-in validation.
         * 
         * @param cb - Callback function that receives form values on successful validation
         * @returns A form submit handler function
         * 
         * @example
         * // Usage in React component
         * // const { handleSubmit, Controller } = form();
         * // <form onSubmit={handleSubmit((data) => console.log('Submitted:', data))}>
         * //   <Controller field="email" render={...} />
         * // </form>
         */
        handleSubmit: (cb: (data: T) => void) => async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
            e.preventDefault();

            let hasError = false;
            const state = get();
            const values = gv<T>(state as any);
            const keys = Object.keys(values) as Array<keyof T>;
            
            // validate all fields dynamically
            if (resolver) {
                for (const key of keys) {
                    const err = await state.resolverValidate(key);
                    if (err) hasError = true;
                }
                if (!hasError) cb(values);
                return;
            }
            
            for (const key of keys) {
                const err = state.defaultValidateField(key);
                if (err) hasError = true;
            }
            if (!hasError) cb(values);
        },
        /**
         * Gets all form values or a specific field value.
         * 
         * @param key - Optional field name to get specific value
         * @returns All values or specific field value
         * 
         * @example
         * const allValues = getValues();  // { email: 'user@example.com', age: 25 }
         * const email = getValues('email');  // 'user@example.com'
         */
        getValues: (key?: keyof T) => {
            if(key){
                return get()[key].value
            }
            return gv(get())
        },
        /**
         * Sets a field value with optional validation.
         * 
         * @param key - The field name to set
         * @param value - The value to set (type-safe based on field)
         * 
         * @example
         * setValue('email', 'user@example.com');
         * setValue('age', 25);
         */
        setValue: (key: keyof T, value: T[keyof T]): void => {
            set({
                [key]:{
                    ...get()[key],
                    value,
                }
            } as any)
        },
        /**
         * Manually set an error message for a field.
         * Useful for server-side errors or custom validation.
         * 
         * @param field - The field name to set error for
         * @param error - The error message to display
         * 
         * @example
         * setError('email', 'This email is already registered');
         */
        setError: (field: keyof T, error: string): void => {
            const fieldState = get()[field];
            set({
                [field]: {
                    ...fieldState,
                    error,
                }
            } as any);
        },
        /**
         * Gets all field errors or a specific field error.
         * If key is provided, returns just that field's error.
         * Otherwise returns an object with all field errors.
         * 
         * @param key - Optional field name to get specific error
         * @returns Object with all errors or a specific error message string
         * 
         * @example
         * // Get all errors
         * const errors = getErrors();
         * // { email: "Email is required", age: "Must be 18+" }
         * 
         * // Get specific field error
         * const emailError = getErrors('email');
         * // "Email is required"
         */
        getErrors: (key?: keyof T): Partial<Record<keyof T, string>> | string => {
            const state = get();
            
            // If key is provided, return specific field error
            if (key) {
                const fieldState = state[key];
                return fieldState?.error || "";
            }
            
            // Otherwise return all errors
            const errors: Partial<Record<keyof T, string>> = {};
            
            Object.keys(state).forEach((k) => {
                const fieldState = state[k as keyof T];
                if (fieldState.error) {
                    errors[k as keyof T] = fieldState.error;
                }
            });
            
            return errors;
        },
        /**
         * Clears error for a specific field.
         * 
         * @param field - The field name to clear error for
         * 
         * @example
         * clearFieldError('email');  // Removes email error
         */
        clearFieldError: (field: keyof T): void => {
            const fieldState = get()[field];
            set({
                [field]: {
                    ...fieldState,
                    error: "",
                }
            } as any);
        },
        /**
         * Clears all field errors at once.
         * 
         * @example
         * clearAllErrors();  // Removes all errors from form
         */
        clearAllErrors: (): void => {
            const state = get();
            const clearedState = {} as any;
            
            Object.keys(state).forEach((key) => {
                const fieldState = state[key as keyof T];
                clearedState[key] = {
                    ...fieldState,
                    error: "",
                };
            });
            
            set(clearedState);
        },
        /**
         * Checks if a specific field has been modified from its initial value.
         * Or checks if any field in the form has been modified.
         * 
         * @param field - Optional field name to check specific field
         * @returns True if field(s) have been modified
         * 
         * @example
         * const formDirty = isDirty();  // Check entire form
         * const emailDirty = isDirty('email');  // Check specific field
         */
        isDirty: (field?: keyof T): boolean => {
            const state = get();
            
            if (field) {
                const fieldState = state[field];
                return fieldState?.isDirty || false;
            }
            
            // Check if any field is dirty
            return Object.keys(state).some((key) => {
                const fieldState = state[key as keyof T];
                return fieldState.isDirty;
            });
        },
        /**
         * Checks if a field has been focused/interacted with.
         * 
         * @param field - The field name to check
         * @returns True if field has been touched
         * 
         * @example
         * if (isTouched('email')) {
         *   // Show validation error only if field was touched
         * }
         */
        isTouched: (field: keyof T): boolean => {
            const state = get();
            const fieldState = state[field];
            return fieldState?.touched || false;
        },
        /**
         * Manually set the touched state of a field.
         * Useful for showing validation errors only after user interaction.
         * 
         * @param field - The field name
         * @param touched - Whether the field has been touched
         * 
         * @example
         * setTouched('email', true);  // Mark as touched
         * setTouched('email', false);  // Mark as not touched
         */
        setTouched: (field: keyof T, touched: boolean): void => {
            const fieldState = get()[field];
            set({
                [field]: {
                    ...fieldState,
                    touched,
                }
            } as any);
        },
        /**
         * Resets all form fields to their initial values and clears all errors.
         * Useful after successful form submission or for clearing the form.
         * 
         * @example
         * reset();  // All fields return to default values and errors are cleared
         */
        reset: (): void => {
            const resetState = {} as any;
            Object.keys(fd).forEach((key) => {
                resetState[key] = {
                    ...fd[key as keyof T],
                    error: "",
                    touched: false,
                    isDirty: false,
                };
            });
            set(resetState);
        },
    }))
    
    /**
     * Component-wrapper for controlled form inputs.
     * Automatically manages field state, validation, and error messages.
     * Supports passing extra input props like ref, disabled, className, etc.
     * 
     * @param field - The field name to control
     * @param render - Function that receives (value, error, onChange, onBlur, extra) and returns ReactNode
     * @param autoFocus - Auto-focus field on mount
     * @param focusOnError - Auto-focus field when error occurs (default: true)
     * @param onBlur - Custom blur handler
     * @param extra props - Any additional props to pass to render function (ref, disabled, className, etc.)
     * @returns Rendered element from the render function
     * 
     * @example
     * // Basic usage with extra props
     * <Controller
     *   field="email"
     *   autoFocus
     *   focusOnError
     *   className="form-input"
     *   render={(value, error, onChange, onBlur, extra) => (
     *     <div>
     *       <input 
     *         value={value} 
     *         onChange={(e) => onChange(e.target.value)}
     *         onBlur={onBlur}
     *         placeholder="Enter email"
     *         {...extra}
     *       />
     *       {error && <span style={{color: 'red'}}>{error}</span>}
     *     </div>
     *   )}
     * />
     * 
     * @example
     * // With ref and additional attributes
     * const emailRef = React.useRef<HTMLInputElement>(null);
     * 
     * <Controller
     *   field="email"
     *   ref={emailRef}
     *   type="email"
     *   disabled={isLoading}
     *   className="input-field"
     *   render={(value, error, onChange, onBlur, extra) => (
     *     <input 
     *       value={value} 
     *       onChange={(e) => onChange(e.target.value)}
     *       onBlur={onBlur}
     *       {...extra}
     *     />
     *   )}
     * />
     */
    function Controller({ 
      field, 
      render
    }: ControllerProps<T>) {
      const state = useForm();
      const value = state[field].value;
      const error = state[field].error;
      const setFieldValue = state.setFieldValue;
      const defaultValidateField = state.defaultValidateField;
      const resolverValidate = state.resolverValidate;
      const setTouched = state.setTouched;
      
      const handleChange = async (newValue: string) => {
        // Update field value
        setFieldValue(field, newValue);
        
        // Mark as touched on change
        setTouched(field, true);
        
        // Validate on change
        if (resolver) {
            await resolverValidate(field);
        } else {
            defaultValidateField(field);
        }
      };

      
      const element = render({error: error || "", onChange: handleChange, value});
      return element;
    }

    /**
     * Returns the form API and Controller component.
     * Call this as a hook in your React component.
     * 
     * @returns Object with handleSubmit and Controller
     * 
     * @example
     * // In your component
     * const { handleSubmit, Controller } = createForm(...form);
     * 
     * // Use in JSX
     * return (
     *   <form onSubmit={handleSubmit((data) => console.log(data))}>
     *     <Controller field="email" render={...} />
     *     <button type="submit">Submit</button>
     *   </form>
     * );
     */
    return () => {
         const handleSubmit = useForm((s)=>s.handleSubmit)
         const setValue = useForm((s)=>s.setValue)
         const getValues = useForm((s)=>s.getValues)
         const getErrors = useForm((s)=>s.getErrors)
         const setError = useForm((s)=>s.setError)
         const reset = useForm((s)=>s.reset)
         const setTouched = useForm((s)=>s.setTouched)
         const isDirty = useForm((s)=>s.isDirty)
         const clearAllErrors = useForm((s)=>s.clearAllErrors)
         const clearFieldError = useForm((s)=>s.clearFieldError)
         const watch = (key: keyof T) => useForm((state) => state[key].value)

        
        return {
            handleSubmit,
            Controller,
            setValue,
            getValues,
            getErrors,
            setError,
            reset,
            watch,
            setTouched,
            isDirty,
            clearAllErrors,
            clearFieldError
        }
    }
}




export {
    createForm,
    yupResolver,
    zodResolver
}