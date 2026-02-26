import { create } from 'zustic'

type Field = {
  value: string
  error: string | null
  required?: { value: boolean; message: string }
  pattern?: { value: RegExp; message: string }
  min?: { value: number; message: string }
  max?: { value: number; message: string }
}

type FormStore = {
  email: Field
  password: Field
  setFieldValue: (field: 'email' | 'password', value: string) => void
  validateField: (field: 'email' | 'password') => void
  handleSubmit: (cb: (data: { email: string; password: string }) => void) => (e: React.FormEvent<HTMLFormElement>) => void
}

interface ControllerProps {
  field: 'email' | 'password';
  render: (value: string, error: string | null, onChange: (value: string) => void) => React.ReactNode;
}


const useForm = create<FormStore>((set, get) => ({
  email: {
    value: '',
    error: null,
    required: { value: true, message: 'Email is required' },
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format',
    },
    min: { value: 5, message: 'Email must be at least 5 characters' },
    max: { value: 255, message: 'Email must be less than 255 characters' },
  },
  password: {
    value: '',
    error: null,
    required: { value: true, message: 'Password is required' },
    pattern: {
      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      message: 'Password must be at least 8 characters and contain letters and numbers',
    },
    min: { value: 8, message: 'Password must be at least 8 characters' },
    max: { value: 255, message: 'Password must be less than 255 characters' },
  },

  // Action to update field value
  setFieldValue: (field, value) => {
    set((state) => ({
      [field]: {
        ...state[field],
        value,
      },
    }));
  },
  
  // Action to validate a field and set error message if validation fails
  validateField: (field) => {
    set((state) => {
      const fieldState = state[field]

      let error: string | null = null

      // check required
      if (fieldState.required?.value && !fieldState.value) {
        error = fieldState.required.message
      } 
      // check pattern
      else if (fieldState.pattern?.value && !fieldState.pattern.value.test(fieldState.value)) {
        error = fieldState.pattern.message
      } 
      // check min length
      else if (fieldState.min && fieldState.value.length < fieldState.min.value) {
        error = fieldState.min.message
      } 
      // check max length
      else if (fieldState.max && fieldState.value.length > fieldState.max.value) {
        error = fieldState.max.message
      }else{
        error = null
      }

      return {
        [field]: {
          ...fieldState,
          error,
        },
      }
    })
  },
  
  handleSubmit: (cb)=> (e) => {
    e.preventDefault()
    get().validateField('email')
    get().validateField('password')
    
    const emailError = get().email.error
    const passwordError = get().password.error   

    if(!emailError && !passwordError) {
      cb({
        email: get().email.value,
        password: get().password.value,
      })
    }
  }
}))

function Controller({ field, render }: ControllerProps) {
  const state = useForm()
  const value = state[field].value
  const error = state[field].error
  const setFieldValue = state.setFieldValue
  const validateField = state.validateField

  const element = render(value, error, (value) => {
    setFieldValue(field, value)
    validateField(field)
  })
  return element
}

export default function FormStateManagement() {
  const handleSubmit = useForm((s)=>s.handleSubmit)

  const onSubmit = (data: { email: string; password: string }) => {
    console.log(data);
  }
  return (
    <div className='container'>
        <form className='form-body'  onSubmit={handleSubmit(onSubmit)}>
            <Controller 
              field='email'
              render={(value, error, onChange) => {
                console.log('input1');
                return (
                  <div>
                    <input type="text" name="email" id="email" value={value} onChange={(e) => onChange(e.target.value)} />
                    {error && <span className='error'>{error}</span>}
                  </div>
                )
              }}
            />
            <Controller 
              field='password'
              render={(value, error, onChange) => {
                 console.log('input2');
                return (
                  <div>
                    <input type="password" name="password" id="password" value={value} onChange={(e) => onChange(e.target.value)} />
                    {error && <span className='error'>{error}</span>}
                  </div>
                )
              }}
            />
            <button type="submit">Submit</button>
        </form>
    </div>
  )
}



