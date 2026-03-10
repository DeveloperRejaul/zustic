import './App.css'
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
      providesTags: (res)=>{
       return res.map(user => ({ type: 'users', id: user.id }))
      },
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
     async onQueryStarted(_arg, {queryFulfilled}) {
        console.log("call onQueryStarted");
       const f1 = api.utils.updateQueryData('getUsers', { page: 1, limit: 10 }, (draft) => {

            const data = [...draft, {
                email:"rezaulkarim@gmail.com",
                id:12341,
                name:"Rezaul ",
                phone:"weerwer",
                username:"werwer",
                website:"aedfwerw"
            }]
            return data
        })
        try {
        await queryFulfilled
        throw new Error('faild')
          
        } catch (error) {
            console.log(error);
            f1?.undo()
        }
        
      },
    }),
  })
})

// ============ DESTRUCTURE HOOKS FROM API ============

// Destructure hooks directly from the API object
const { useGetUsersQuery, useCreatePostMutation } = api




function QueryAndStateManagement() {

  // Use the API queries and mutations
  const { data: users} = useGetUsersQuery({ page: 1, limit: 10 })
  const [createPost, res] = useCreatePostMutation()

  const handleCreatePost = () => {
    createPost({
      title: 'My New Post',
      body: 'This is a test post'
    })
  }


  

  return (
    <div className="container">
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

export default QueryAndStateManagement

