import { create } from "core";
import { getNumberRule, getRequired, getValues, normalizeDefaultValues, parseValue, yupResolver, zodResolver } from "./utils";
import type { ControllerProps, HandleSubmitType, HookFormParams } from "./type";


function createForm<T>(params:HookFormParams<T>) {
    const {defaultValues,resolver} = params
    const fd:any = normalizeDefaultValues(defaultValues)
    const useForm = create<any>((set, get) => ({
        ...fd,
        setFieldValue:(field:any, value:any) => {
            const fieldState = get()[field];
            set({
                [field]: {
                    ...fieldState,
                    value: parseValue<T>(value, fd[field]?.value)
                }
            })
        },
        defaultValidateField: (field:any) => {
            const fieldState = get()[field];
            let error: string = "";
            const value = parseValue<T>(fieldState.value, fieldState[field]?.value);

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
            set({
                [field]: {
                    ...fieldState,
                    error,
                }
            })

            return error
        },
        resolverValidate: async (field:any) => {
            if(!resolver) return

            const state = get()
            const fieldState = state[field];
            let error: string = "";
            const values = getValues<T>(state);
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
            });
            return error
        },
        handleSubmit: (cb: (data:T)=>void) => async (e:React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            let hasError = false;
            const state = get();
            const values = getValues<T>(state);
            const keys = (Object.keys(values as any) as Array<keyof T>)
            
            // validate all fields dynamically
            if (resolver) {
                for (const key of keys) {
                    const err = await state.resolverValidate(key);
                    if (err) hasError = true
                }
                if (!hasError)  cb(values);
                return
            }
            
            for (const key of keys) {
                const err = await state.defaultValidateField(key);
                if (err) hasError = true
            }
            if (!hasError)  cb(values);
        }
    }))
    
    function Controller({ field, render }: ControllerProps<T>) {
      const state = useForm()
      const value = state[field].value
      const error = state[field].error
      const setFieldValue = state.setFieldValue
      const defaultValidateField = state.defaultValidateField
      const resolverValidate = state.resolverValidate
    
      const handleChange = async (value:string) => {
        setFieldValue(field, value)
        if(resolver){
            await resolverValidate(field)
            return
        }
        defaultValidateField(field)
      }

      const element = render(value, error, handleChange)
      return element
    }

    return () => {
         const handleSubmit = useForm((s)=>s.handleSubmit)
        
        return {
            handleSubmit: handleSubmit as HandleSubmitType<T>,
            Controller,
        }
    }
}




export {
    createForm,
    yupResolver,
    zodResolver
}