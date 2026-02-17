import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {create, type Middleware} from 'zustic'
import {createApi, type ApiPlugin} from 'zustic/query'
// import type { PostRes, User } from './types'
function devtoolsPlugin():ApiPlugin {
      return {
        name: "devtools",
        beforeQuery: (arg) => {
          console.log("🟡 Request:", arg);
        },

        afterQuery: (result) => {
          console.log("🟢 Response:", result);
        },

        onError: (error) => {
          console.error("🔴 Global Error:", error);
        }, 
        middleware: async ()=>{
          return {}
        }
      };
}

export interface Root {
  id: number
  name: string
  username: string
  email: string
  address: Address
  phone: string
  website: string
  company: Company
}

export interface Address {
  street: string
  suite: string
  city: string
  zipcode: string
  geo: Geo
}

export interface Geo {
  lat: string
  lng: string
}

export interface Company {
  name: string
  catchPhrase: string
  bs: string
}

type CreateType = {
  count: number;
  inc: () => void;
  dec: () => void;
  getTotal: () => number;
}

// const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
//     // console.log('prev:', get());
//     await next(partial);
//     // console.log('next:', get());
// };

const useCounter = create<CreateType>((set, get) => ({
  count: 0,
  inc: () => set(() => ({ count: get().count + 1 })),
  dec: () => set(() => ({ count: get().count - 1 })),
  getTotal: () => get().count
}))


// example of api call
const api = createApi({
  baseQuery: async (params) => {
    try {
      const endpoind = typeof params ==='string' ? params : params.url;
      const headers = typeof params !== "string" ? params?.headers: {}
      const body = typeof params !== "string" ? JSON.stringify(params.body) : undefined;
      const method = typeof params === "string" ? "GET" : params.method

      const res = await fetch(`https://jsonplaceholder.typicode.com/${endpoind}`, {
        method,
        headers,
        body,
      })
      const data = await res.json()
      return {
       data
      }
    } catch (error) {
      return{
        error
      }
    }
  },
  cacheTimeout:5000,
  plugins:[
    // devtoolsPlugin()
  ],
  endpoints(builder) {
    return {
      getUser: builder.query<Root[],{page:number, limit:number}>({
        query:({page, limit}) => ({
          method:"GET",
          url:`/users?_page=${page}&_limit=${limit}`
        }),
        // plugins:[devtoolsPlugin()],
      //  async queryFnc(arg, baseQuery) {
      //     try {
      //       return baseQuery("/users")
      //     } catch  {
      //       return {
      //         error: "helllo"
      //       }
      //     }
      // },
      //  transformResponse(data){
      //     return {
      //       email: data[0].email
      //     }
      //   },
        // transformError(error) {
        //   return{
        //     name:error?.name
        //   }
        // },
        onError(err) {
          // console.log(err);
        },
        onSuccess(data) {
          // console.log(data);
        },
      }),
      createPost: builder.mutation<{title:string}, {title:string, body:string}>({
        query:(arg)=> ({
          url:"/posts",
          method:"POST",
          body:{
            ...arg
          },
          headers: {
            'Content-type': 'application/json; charset=UTF-8',
          },
        }),
        transformBody(body) {
          return {
            ...body,
            userId: 1,
          }
        },
        transformHeader(header) {
          return header
        },
        // transformResponse(value:PostRes) {
        //   return{
        //     title: value.title
        //   }
        // },
        // transformError(error) {
        //   return{
        //     name:error?.name
        //   }
        // },
        onError(err) {

        },
        onSuccess() {
          console.log('success');
          
          api.utils.updateQueryData('getUser', {page: 1, limit: 10}, (draft) => {
            draft = draft.map(d=> ({...d,email: "hello world"}))
            return draft
          })
        },
      })
    }
  },
})
const {
  useGetUserQuery,
  useCreatePostMutation
} = api
function App() {
  const {count, inc} = useCounter()
  const {data} = useGetUserQuery({page:1, limit: 2})
  const {data:data2} = useGetUserQuery({page:1, limit: 10})

  console.log('data1', data);
  console.log('data2', data2);
  
  const [createPost] = useCreatePostMutation()
  
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={async () => {
          // reFetch()

          // console.log(res);
          
          // inc()
          await createPost({
            title: 'foo',
            body: 'bar',
          })
        //   console.log(res);
        }}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
