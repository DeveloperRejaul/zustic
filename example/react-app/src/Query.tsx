import React from 'react'

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
     getPost: builder.query<{}, void>({
        query: () => '/posts'
     }),
     
     getUser: builder.query({
        query: () => '/users',
        async onQueryStarted(arg, a) {
            try {
            
            } catch (error) {
                
            }
        },
     })
    }),
    
})



export default function Query() {
    const {data, isLoading} = api.useGetPostQuery()

  return (
    <div>Query</div>
  )
}
