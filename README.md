<div align="center">

# Zustic

### Lightweight State Management for Modern React Applications

[![npm version](https://img.shields.io/npm/v/zustic.svg)](https://npm.im/zustic)
[![npm downloads](https://img.shields.io/npm/dm/zustic.svg)](https://npm.im/zustic)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/zustic)](https://bundlephobia.com/result?p=zustic)
[![License](https://img.shields.io/npm/l/zustic.svg)](LICENSE)

A **fast, minimal state management solution** for React ecosystems. Works seamlessly with React, Next.js, and React Native with predictable state updates and a tiny footprint.

[📖 Documentation](https://zustic.github.io/) · [🐛 Report Bug](https://github.com/DeveloperRejaul/zustic/issues) · [💡 Request Feature](https://github.com/DeveloperRejaul/zustic/issues)

</div>

---

## Key Features

### Core Features
- **Ultra-Lightweight** — Only ~500B (gzipped) with zero dependencies
- **Simple API** — One function (`create`) to manage all your state
- **React Hooks** — Native React hooks integration with automatic subscriptions
- **Multi-Platform** — React, React Native, Next.js, and modern frameworks
- **Reactive Updates** — Automatic re-renders with optimized batching
- **TypeScript First** — Full type safety with perfect type inference
- **Production Ready** — Battle-tested in real applications

### Advanced Capabilities
- **Store Middleware System** — Extend state management with logging, persistence, validation, and more
- **Query System** — Built-in API data fetching with automatic caching, mutations, and plugins
- **Automatic Caching** — Smart cache management with configurable timeout
- **Direct State Access** — `get()` function for reading state outside components
- **Selective Subscriptions** — Components only re-render when their data changes
- **Fully Extensible** — Build custom middleware and plugins for any use case
- **Easy Testing** — Simple to test stores and API queries with middleware and async operations
- **Plugin System** — Global hooks for authentication, logging, error handling
- **Framework Agnostic** — Create middleware and plugins once, use everywhere

---

## Installation

Choose your favorite package manager:

```bash
# npm
npm install zustic

# yarn
yarn add zustic

# pnpm
pnpm add zustic
```

---

## Why Zustic?

### Size & Performance
| Metric | Zustic | Redux | Zustand | Context API |
|--------|--------|-------|---------|-------------|
| **Bundle Size** | ~500B | ~6KB | ~2KB | Built-in |
| **Performance** | Optimized | Good | Optimized | Re-renders |
| **Dependencies** | 0 | 0 | 0 | 0 |

### Developer Experience
- **Ultra-Simple API**: Master everything in 5 minutes
- **Zero Boilerplate**: No actions, reducers, or providers
- **TypeScript Native**: Perfect type inference out of the box
- **Great DX**: Intuitive `create()`, `set()`, `get()` functions

### Comparison with Other Libraries

| Feature | Zustic | Redux | Zustand | Context API |
|---------|--------|-------|---------|-------------|
| Bundle Size | ~500B | ~6KB | ~2KB | 0B |
| Learning Curve | ⭐ Easy | ⭐⭐⭐⭐⭐ Hard | ⭐⭐ Easy | ⭐⭐⭐ Medium |
| Boilerplate | Minimal | Massive | Minimal | Some |
| TypeScript | Excellent | Good | Good | Good |
| Store Middleware | Built-in | Required | Optional |  No |
| Query System | Built-in |  Separate |  Separate |  No |
| Caching | Automatic | Optional | Optional |  No |
| API Simplicity | Very Simple | Complex | Simple | Medium |

---

##  Quick Start

### 1. Create Your Store

```typescript
import { create } from 'zustic';

type CounterStore = {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
};

export const useCounter = create<CounterStore>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### 2. Use in Your Component

```typescript
import { useCounter } from './store';

function Counter() {
  const { count, inc, dec, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>➕ Increment</button>
      <button onClick={dec}>➖ Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;
```

That's it! No providers, no boilerplate, just pure state management.

---

## Core Concepts

### Create a Store

The `create` function is the heart of Zustic:

```typescript
const useStore = create<StoreType>((set, get) => ({
  // Your state and actions
}));
```

- **`set`**: Update state (supports partial updates and functions)
- **`get`**: Read current state (works outside components)

### Reading State in Components

```typescript
function Component() {
  // Subscribe to entire store
  const state = useStore();
  
  // Or subscribe to specific properties (optimized)
  const count = useStore((state) => state.count);
  
  return <div>{count}</div>;
}
```

## Store Middleware System

Extend Zustic stores with powerful middleware for logging, persistence, validation, and more.

### Logger Middleware

```typescript
const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
  console.log('Previous State:', get());
  await next(partial);
  console.log('New State:', get());
};

export const useStore = create<StoreType>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger()]
);
```

### Persistence Middleware

```typescript
const persist = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
  await next(partial);
  localStorage.setItem('store', JSON.stringify(get()));
};

export const useStore = create<StoreType>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }),
  [persist()]
);
```

### Validation Middleware

```typescript
const validate = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
  // Validate before updating
  if (typeof partial === 'object' && partial.count < 0) {
    console.warn('Invalid state update');
    return;
  }
  await next(partial);
};

export const useStore = create<StoreType>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }),
  [validate()]
);
```

### Multiple Middleware

```typescript
export const useStore = create<StoreType>(
  (set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }),
  [logger(), persist(), validate()]
);
```

---

## Query System (API Data Fetching)

Zustic now includes a powerful query system for managing API requests with automatic caching, mutations, middleware, and plugins.

### Create an API

```typescript
import { createApi } from 'zustic/query';

type User = {
  id: number;
  name: string;
  email: string;
};

const baseQuery = async (args: any) => {
  try {

    const response = await fetch(`https://api.example.com${args.url}`, {
      method: args.method || 'GET',
      headers: args.headers,
      body: args.body ? JSON.stringify(args.body) : undefined,
    });
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error };
  }
};

export const api = createApi({
  baseQuery,
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => ({
        url: '/users',
        method: 'GET',
      }),
      transformResponse: (data) => data.map((u: User) => ({ ...u, name: u.name.toUpperCase() })),
    }),
    
    getUser: builder.query<User, { id: number }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
    }),
    
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      onSuccess: (data) => console.log('User created:', data),
      onError: (error) => console.error('Failed to create:', error),
    }),
    
    updateUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: `/users/${body.id}`,
        method: 'PUT',
        body,
      }),
    }),
  }),
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
});
```

### Use Queries in Components

```typescript
import { api } from './api';

function UsersList() {
  // Query hook automatically fetches on mount
  const { data: users, isLoading, isError, error, reFetch } = api.useUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <h2>Users</h2>
      <button onClick={() => reFetch()}>Refresh</button>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Skip Queries (Conditional Fetching)

```typescript
function UserDetail({ userId }: { userId?: number }) {
  // Only fetch when userId is provided
  const { data: user, isLoading } = api.useGetUserQuery(
    { id: userId! },
    { skip: !userId }
  );

  if (!userId) return <div>Select a user</div>;
  if (isLoading) return <div>Loading...</div>;

  return <div>{user?.name} ({user?.email})</div>;
}
```

### Use Mutations in Components

```typescript
function CreateUserForm() {
  // Mutation hook returns [mutate, state]
  const [createUser, { isLoading, isError, error, data, isSuccess }] = api.useCreateUserMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await createUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {isSuccess && <p User created!</p>}
      {isError && <p> Error: {error?.message}</p>}
    </form>
  );
}
```

### Query API Features

#### Transformations

```typescript
getUser: builder.query<User, { id: number }>({
  query: ({ id }) => ({
    url: `/users/${id}`,
    method: 'GET',
  }),
  // Transform the response data
  transformResponse: (data) => ({
    ...data,
    formattedDate: new Date(data.createdAt).toLocaleDateString(),
  }),
  // Transform errors
  transformError: (error) => ({
    message: error.message || 'Unknown error occurred',
    code: error.code,
  }),
  // Transform request body
  transformBody: (body) => ({
    ...body,
    timestamp: Date.now(),
  }),
  // Transform request headers
  transformHeader: (headers) => ({
    ...headers,
    'Authorization': `Bearer ${getToken()}`,
  }),
}),
```

#### Hooks and Callbacks

```typescript
createUser: builder.mutation<User, CreateUserInput>({
  query: (body) => ({
    url: '/users',
    method: 'POST',
    body,
  }),
  onSuccess: async (data) => {
    console.log( 'User created:', data)
  },
  onError: async (error) => {
    console.error(' Failed:', error)
  },
}),
```

#### Automatic Caching

```typescript
const api = createApi({
  baseQuery,
  endpoints: (builder) => ({
    getUser: builder.query<User, { id: number }>({
      query: ({ id }) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
    }),
  }),
  cacheTimeout: 10 * 60 * 1000, // Cache for 10 minutes
});

// First call: fetches from API
const result1 = useGetUserQuery({ id: 1 });

// Second call (within cache timeout): uses cached data
const result2 = useGetUserQuery({ id: 1 });

// Force refetch
const result3 = await reFetch();
```

#### Custom Query Function

```typescript
getUserCustom: builder.query<User, { id: number }>({
  queryFnc: async (arg, baseQuery) => {
    // Implement custom logic
    const token = localStorage.getItem('token');
    return baseQuery({
      url: `/users/${arg.id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
}),
```

---

## Query Middleware & Plugins

### Query-Level Middleware

```typescript
const requestLogger: ApiMiddleware = (ctx, next) => {
  console.log('Request:', ctx.arg);
  const result = await next();
  console.log('Response:', result);
  return result;
};

getUser: builder.query<User, { id: number }>({
  query: ({ id }) => ({
    url: `/users/${id}`,
    method: 'GET',
  }),
  middlewares: [requestLogger],
}),
```

### Global Plugins

```typescript
const authPlugin: ApiPlugin = {
  name: 'auth-plugin',
  
  beforeQuery: (ctx) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }
  },
  
  afterQuery: (result, ctx) => {
    if (result.error?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
  },
  
  onError: (error, ctx) => {
    console.error('API Error:', error);
  },
};

const api = createApi({
  baseQuery,
  endpoints: (builder) => ({
    // endpoints...
  }),
  plugins: [authPlugin],
});
```

---

## Multi-Platform Examples

### React Web

```typescript
import { create } from 'zustic';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

export default function App() {
  const { count, inc } = useStore();
  return (
    <div>
      <p>{count}</p>
      <button onClick={inc}>Increment</button>
    </div>
  );
}
```

### React Native

```typescript
import { create } from 'zustic';
import { View, Text, Button } from 'react-native';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

export default function App() {
  const { count, inc } = useStore();
  return (
    <View>
      <Text>{count}</Text>
      <Button title="Increment" onPress={inc} />
    </View>
  );
}
```

### Next.js

```typescript
'use client';

import { create } from 'zustic';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
}));

export default function Page() {
  const { count, inc } = useStore();
  return (
    <div>
      <p>{count}</p>
      <button onClick={inc}>Increment</button>
    </div>
  );
}
```

---

## Testing

Zustic stores are easy to test:

```typescript
import { create } from 'zustic';

// Your store
const useStore = create((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// Test it
describe('Counter Store', () => {
  it('should increment count', () => {
    useStore.set({ count: 0 });
    useStore.get().inc();
    expect(useStore.get().count).toBe(1);
  });

  it('should reset count', () => {
    useStore.set({ count: 5 });
    useStore.get().reset();
    expect(useStore.get().count).toBe(0);
  });
});
```

---

## Advanced Examples

### Async State

```typescript
const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  
  fetchUser: async (id: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();
      set({ user, loading: false, error: null });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### Computed State

```typescript
const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  get total() {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  },
}));
```

### Nested Stores

```typescript
const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

const useAppStore = create((set) => ({
  auth: useAuthStore,
  theme: 'light',
}));
```

---

## Resources

- 📖 **[Full Documentation](https://zustic.github.io/)** - Complete API reference and guides
- 🐛 **[GitHub Issues](https://github.com/DeveloperRejaul/zustic/issues)** - Report bugs and request features
- 💬 **[Discussions](https://github.com/DeveloperRejaul/zustic/discussions)** - Ask questions and share ideas
- 📦 **[NPM Package](https://npm.im/zustic)** - Install and view package info

---

## API Reference

### `create<T>(initializer, middlewares?)`

Creates a new store with state and actions.

**Parameters:**
- `initializer` - Function that receives `set` and `get`, returns initial state
- `middlewares` (optional) - Array of middleware functions

**Returns:**
- A hook function that provides access to store state and actions

**Example:**
```typescript
const useStore = create((set, get) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  getValue: () => get().value,
}));
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/DeveloperRejaul/zustic).

---

## License

MIT License © 2024 [Rejaul Karim](https://github.com/DeveloperRejaul)

---

## Author

Created by **Rejaul Karim** - [GitHub](https://github.com/DeveloperRejaul)

---

<div align="center">

### Made with ❤️ for the React community

⭐ Star us on [GitHub](https://github.com/DeveloperRejaul/zustic) if you find this helpful!

</div>
