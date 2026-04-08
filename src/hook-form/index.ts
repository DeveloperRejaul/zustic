import { create } from "core";
import { getNumberRule, getRequired, getValues } from "./utils";
import type { HookFormParams } from "./types";



function createForm<T>(params:HookFormParams<T>) {
    const {defaultValues,resolver} = params

    const useForm = create<any>((set, get) => ({
        ...defaultValues,
        setFieldValue:(field:any, value:any) => set((state) => ({[field]: {...state[field],value}})),
        validateField: (field:any) => set((state)=>{
            const fieldState = state[field];
            let error: string | null = null;
            const value = fieldState.value;

            const required = getRequired(fieldState.required, field);
            const min = getNumberRule(fieldState.min, "min");
            const max = getNumberRule(fieldState.max, "max");

            // handle  required
            if (required.value && !value) {
                error = required.message;
            }

            // pattern
            else if(typeof value === "string" && fieldState.pattern && !fieldState.pattern.value.test(value)){
                error = fieldState.pattern.message;
            }

            // min
            else if (min &&((typeof value === "string" && value.length < min.value) || (typeof value === "number" && value < min.value))) {
                error = min.message;
            }

            // max
            else if (max && ((typeof value === "string" && value.length > max.value) || (typeof value === "number" && value > max.value))) {
                error = max.message;
            }

            return {
                [field]: {
                    ...fieldState,
                    error,
                },
            };

        }),
        handleSubmit: (cb: (data:T)=>void) => (e:React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const state = get();

            let hasError = false;

            //get all values
            const values = getValues<T>(state);

            // 1. resolver validation (Zod/Yup)
            if (resolver) {
                const result = resolver(values);

                if (result?.errors) {
                hasError = true;

                set((state: any) => {
                    const updated: any = {};

                    Object.keys(result.errors!).forEach((key) => {
                        updated[key] = {
                            ...state[key],
                            error: result.errors![key as keyof T],
                        };
                    });

                    return updated;
                });
                }

                if (!hasError) cb(values);

                return;
            }

            // validate all fields dynamically
            (Object.keys(values as any) as Array<keyof T>).forEach((key) => {
                state.validateField(key);
                const fieldState = state[key];
                if (fieldState.error) hasError = true
            });

            // submit only if no errors
            if (!hasError)  cb(values);
        }
    }))

    return () => {
         const handleSubmit = useForm((s)=>s.handleSubmit)
        
        return {
            handleSubmit: handleSubmit as (cb: (data: T) => void) => (e: React.FormEvent<HTMLFormElement>) => void,
        }
    }
}




// type FormType = {
//     email: string
// }

// const useForm = createForm<FormType>({
//     defaultValues:{
//       email:""
//     }
// })

// const {handleSubmit} = useForm()

// const onSubmit = (data:FormType) => {
//     console.log('Form submitted:', data);
//     // Send to API
//   }
// handleSubmit(onSubmit)