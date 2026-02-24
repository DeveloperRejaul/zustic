import './App.css'
import { create } from 'zustic'
import { createApi } from 'zustic/query'

// Type definitions for API response
interface User {
  id: number
  name: string
  email: string
  username: string
  phone: string
  website: string
}

// ============ STATE MANAGEMENT ============

type CounterState = {
  count: number
  inc: () => void
  dec: () => void
}

// Create a simple counter store using Zustic
const useCounter = create<CounterState>((set, get) => ({
  count: 0,
  inc: () => set(() => ({ count: get().count + 1 })),
  dec: () => set(() => ({ count: get().count - 1 }))
}))


// ============ API QUERIES & MUTATIONS ============

// Create an API with queries and mutations
const api = createApi({
  baseQuery: async (params) => {
    try {
      const endpoint = typeof params === 'string' ? params : params.url
      const method = typeof params === 'string' ? 'GET' : params.method
      const headers = typeof params !== 'string' ? params?.headers : {}
      const body = typeof params !== 'string' ? JSON.stringify(params.body) : undefined

      const res = await fetch(`https://jsonplaceholder.typicode.com${endpoint}`, {
        method,
        headers,
        body
      })
      const data = await res.json()
      return { data }
    } catch (error) {
      return { error }
    }
  },
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  tagTypes: ['users', 'posts'] as const,
  endpoints: (builder) => ({
    // Query to fetch users
    getUsers: builder.query<User[], { page: number; limit: number }>({
      query: ({ page, limit }) => ({
        method: 'GET',
        url: `/users?_page=${page}&_limit=${limit}`
      }),
      providesTags: ['users'],
    }),

    // Mutation to create a post
    createPost: builder.mutation<
      { id: number; title: string },
      { title: string; body: string }
    >({
      query: (arg) => ({
        url: '/posts',
        method: 'POST',
        body: arg,
        headers: {
          'Content-Type': 'application/json'
        }
      }),

      transformBody: (body) => ({
        ...body,
        userId: 1
      }),
      onSuccess: () => {
        // Invalidate users cache on successful post creation
        api.utils.invalidateTags(['posts'])
        
        // Optionally update query data optimistically
        api.utils.updateQueryData('getUsers', { page: 1, limit: 10 }, (draft) => {
          return draft // You could mutate draft here if needed
        })
      },
    })
  })
})

const { useGetUsersQuery, useCreatePostMutation } = api
// ============ REACT COMPONENT ============

function App() {
  // Use the counter store
  const { count, inc, dec } = useCounter()

  // Use the API queries and mutations
  const { data: users} = useGetUsersQuery({ page: 1, limit: 10 })
  const [createPost, res] = useCreatePostMutation()

  const handleCreatePost = () => {
    createPost({
      title: 'My New Post',
      body: 'This is a test post'
    })
  }

  console.log(res);
  
  

  return (
    <div className="container">
      <h1>Zustic Example</h1>

      {/* Counter Section */}
      <section>
        <h2>Counter (State Management)</h2>
        <p>Count: {count}</p>
        <div className="button-group">
          <button onClick={inc}>Increment</button>
          <button onClick={dec}>Decrement</button>
        </div>
      </section>

      {/* Users List Section */}
      <section>
        <h2>Users (Queries)</h2>
        {users ? (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <strong>{user.name}</strong> - {user.email}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading users...</p>
        )}
      </section>

      {/* Create Post Section */}
      <section>
        <h2>Create Post (Mutations)</h2>
        <button onClick={handleCreatePost} disabled={res.isLoading}>
          {res.isLoading ? 'Creating...' : 'Create Post'}
        </button>
      </section>
    </div>
  )
}

export default App
