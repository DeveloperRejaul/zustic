import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {create, type Middleware, createApi} from 'zustic'

type CreateType = {
  count: number;
  inc: () => void;
  dec: () => void;
  getTotal: () => number;
}

const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
    console.log('prev:', get());
    await next(partial);
    console.log('next:', get());
};

const useCounter = create<CreateType>((set, get) => ({
  count: 0,
  inc: () => set(() => ({ count: get().count + 1 })),
  dec: () => set(() => ({ count: get().count - 1 })),
  getTotal: () => get().count
}),[logger<CreateType>()])


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
      return{
        data
      }
    } catch (error) {
      return{
        error
      }
    }
  },
  endpoints(builder) {
    return {
      getUser: builder.query<void>({
        query:() => ({
          method:"GET",
          url:"/users"
        }),
      }),
      createPost: builder.mutation<void, {title:string, body:string, userId:number}>({
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
  const res = useGetUserQuery()
  const [createPost, result] = useCreatePostMutation()

  console.log("res", res);
  console.log('result', result);
  
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
        <button onClick={() => {
          // inc()
          createPost({
            title: 'foo',
            body: 'bar',
            userId: 1,
          })
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
