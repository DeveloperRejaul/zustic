import React, { useEffect } from 'react'

import {createApi} from 'zustic/query'


const api = createApi({
    baseQuery: async (params) => {
       try {
        const url = typeof params === "string" ?`https://jsonplaceholder.typicode.com${params}`:`https://jsonplaceholder.typicode.com${params.url}`;
        const res = await fetch(
            url,
            {
                method: typeof params !== "string" ? params.method : "GET",
                headers: typeof params !== "string" ? params.headers : {},
                body: typeof params !== "string"  ? JSON.stringify(params.body) : undefined,
            }
        );

        if (!res.ok) {
            return { error: `HTTP ${res.status}` };
        }

        return { data: await res.json() };
        } catch (error) {
        return {
            error:
            error instanceof Error ? error.message : "Unknown error",
        };
        }
    },

    endpoints: (builder) =>  ({
     getPost: builder.query<{name:string}, {id:string}>({
        query: () => '/posts'
     }),
     
     getUser: builder.query<{hello: string}, void>({
        query: () => '/users',
        async onQueryStarted(arg, a) {
            try {
            const {data} = await api.useGetPostQuery.initiate({id: '10'})
            console.log('data1', data);
            
            } catch (error) {
                
            }
        },
     })
    }),
    
})



export default function Query() {
    const [getUser, res] = api.useLazyGetUserQuery()

    console.log('res', res);
    

  return (
    <div
    
    onClick={async() => {
        const res1=  await getUser()
        console.log("res1",res1);
        
         
    }}
    
    >Query</div>
  )
}
