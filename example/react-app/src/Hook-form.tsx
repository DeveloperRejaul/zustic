import React, { useState } from "react";
import { z } from "zod";
import * as yup from "yup";
import { createForm, zodResolver, yupResolver } from "zustic/hook-form";

type FormType = {
  email: string;
  name: string;
};

// ✅ define schema
const schema = z.object({
  email: z.string().email("Invalid email"),
});

const schemaYup = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
});


const useForm = createForm<FormType, {xyz:string}>({
  defaultValues: {
      email: {
        value: "",
      },
  }
});

export default function HookForm() {
  const { handleSubmit, Controller ,reset} = useForm();
  
 const [isLoading, setIsLoading] = useState(false)


 console.log(isLoading);
 
  return (
    <form
      onSubmit={handleSubmit((data) => {
        setIsLoading(pre => !pre);
      })}
    >
      <Controller
        field="email"
        render={({onChange, value, error}) => (
          <div>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Email"
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        )}
      />
      
      <Controller
        field="name"
        render={({onChange, value, error}) => (
          <div>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Name"
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
        )}
      />

      <button type="button" onClick={reset}>Reset</button>
      <button type="submit">Submit</button>
    </form>
  );
}