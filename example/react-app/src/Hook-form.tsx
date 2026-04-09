import React from "react";
import { z } from "zod";
import * as yup from "yup";
import { createForm, zodResolver, yupResolver } from "zustic/hook-form";

type FormType = {
  email: number;
};

// ✅ define schema
const schema = z.object({
  email: z.string().email("Invalid email"),
});

const schemaYup = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
});


const useForm = createForm<FormType>({
  defaultValues: {
    email: {
        value: 0,
        required: true,
        pattern:{
            value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: "Invalid email address",
        }
    },
    
  },
});

export default function HookForm() {
  const { handleSubmit, Controller } = useForm();

  
  return (
    <form
      onSubmit={handleSubmit((data) => {
        console.log("Yup Submit:", data);
      })}
    >
      <Controller
        field="email"
        render={(value, error, onChange) => (
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

      <button type="submit">Submit</button>
    </form>
  );
}