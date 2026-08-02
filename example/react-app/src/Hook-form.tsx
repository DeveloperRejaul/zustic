import React, { useState } from "react";
import { z } from "zod";
import * as yup from "yup";
import { createForm, zodResolver, yupResolver } from "zustic/hook-form";

type FormType = {
  email: string;
  name: string;
  user:{name:string, email:string}[];
};

// ✅ define schema
const schema = z.object({
  email: z.string().email("Invalid email"),
});

const schemaYup = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
});


const useForm = createForm<FormType, {xyz:string}>({
  defaultValues:{
    email: {
      value: "",
      required: { value: true, message: "Email is required" },
    },
    name: {
      value: "",
      required: { value: true, message: "Name is required" },
    },
   user:[
    {
      name: {
        value: "",
        required: { value: true, message: `User name  is required` },
      },
      email: {
        value: "",
        required: { value: true, message: `User email  is required` },
      },
    }
  ]
  }
});

export default function HookForm() {
  const { handleSubmit, Controller ,reset, getValues} = useForm();
  
 const [isLoading, setIsLoading] = useState(false)


 console.log(isLoading);
 
 
  return (
    <form
      onSubmit={handleSubmit((data) => {
        setIsLoading(pre => !pre);
        console.log(data.user[0].name);
        console.log(data.user[0].email);
        console.log(data.user[1].name);
        console.log(data.user[1].email);
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
      {[4, 5].map((_, index) => (
        <div key={index}>
        <Controller
          field={`user.${index}.name`}
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
        <Controller
          field={`user.${index}.email`}
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
        </div>
      ))}

      <button type="button" onClick={reset}>Reset</button>
      <button type="submit">Submit</button>
    </form>
  );
}