<div align="center">

# 🎯 Zustic

### Lightweight State Management for Modern React Applications

[![npm version](https://img.shields.io/npm/v/zustic.svg)](https://npm.im/zustic)
[![npm downloads](https://img.shields.io/npm/dm/zustic.svg)](https://npm.im/zustic)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/zustic)](https://bundlephobia.com/result?p=zustic)
[![License](https://img.shields.io/npm/l/zustic.svg)](LICENSE)

A **fast, minimal state management solution** for React ecosystems. Works seamlessly with React, Next.js, and React Native with predictable state updates and a tiny footprint.

[📖 Documentation](https://zustic.github.io/) · [🐛 Report Bug](https://github.com/DeveloperRejaul/zustic/issues) · [💡 Request Feature](https://github.com/DeveloperRejaul/zustic/issues)

</div>

---

## ✨ Key Features

### Core Features
- **🪶 Ultra-Lightweight** — Only ~500B (gzipped) with zero dependencies
- **⚡ Simple API** — One function (`create`) to manage all your state
- **🎣 React Hooks** — Native React hooks integration with automatic subscriptions
- **📱 Multi-Platform** — React, React Native, Next.js, and modern frameworks
- **🔄 Reactive Updates** — Automatic re-renders with optimized batching
- **💾 TypeScript First** — Full type safety with perfect type inference
- **🚀 Production Ready** — Battle-tested in real applications

### Advanced Capabilities
- **🧩 Middleware System** — Extend functionality with logging, persistence, validation, and more
- **📡 Direct State Access** — `get()` function for reading state outside components
- **🎯 Selective Subscriptions** — Components only re-render when their data changes
- **⚙️ Fully Extensible** — Build custom middleware for any use case
- **🧪 Easy Testing** — Simple to test stores with middleware and async operations
- **🔗 Framework Agnostic** — Create middleware once, use everywhere

---

## 📦 Installation

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

## 🤔 Why Zustic?

### Size & Performance
| Metric | Zustic | Redux | Zustand | Context API |
|--------|--------|-------|---------|-------------|
| **Bundle Size** | ~500B | ~6KB | ~2KB | Built-in |
| **Performance** | ⚡ Optimized | Good | ⚡ Optimized | ⚠️ Re-renders |
| **Dependencies** | 0 | 0 | 0 | 0 |

### Developer Experience
- **Ultra-Simple API**: Master everything in 5 minutes
- **Zero Boilerplate**: No actions, reducers, or providers
- **TypeScript Native**: Perfect type inference out of the box
- **Great DX**: Intuitive `create()`, `set()`, `get()` functions

### Comparison with Other Libraries

| Feature | Zustic | Redux | Zustand | Context API |
|---------|--------|-------|---------|-------------|
| Bundle Size | ~500B ✅ | ~6KB | ~2KB | 0B |
| Learning Curve | ⭐ Easy | ⭐⭐⭐⭐⭐ Hard | ⭐⭐ Easy | ⭐⭐⭐ Medium |
| Boilerplate | Minimal ✅ | Massive | Minimal | Some |
| TypeScript | Excellent ✅ | Good | Good | Good |
| Middleware | Built-in ✅ | Required | Optional | ❌ No |
| API Simplicity | Very Simple ✅ | Complex | Simple | Medium |

---

## 🚀 Quick Start

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
      <button onClick={reset}>🔄 Reset</button>
    </div>
  );
}

export default Counter;
```

That's it! No providers, no boilerplate, just pure state management.

---

## 📚 Core Concepts

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
<!-- 
### Reading State Outside Components

```typescript
// In event handlers, callbacks, or services
const currentState = useStore.get();
console.log(currentState.count);
```

### Updating State

```typescript
// Partial update
useStore.set({ count: 5 });

// Functional update with access to current state
useStore.set((state) => ({ 
  count: state.count + 1 
}));

// Async updates
useStore.set(async (state) => ({
  data: await fetchData(),
  loading: false
}));
``` -->

---

## 🧩 Middleware System

Extend Zustic with powerful middleware for logging, persistence, validation, and more.

### Logger Middleware

```typescript
const logger = <T extends object>(): Middleware<T> => (set, get) => (next) => async (partial) => {
  console.log('🔵 Previous State:', get());
  await next(partial);
  console.log('🟢 New State:', get());
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

## 📱 Multi-Platform Examples

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

## 🧪 Testing

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

## 💡 Advanced Examples

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

## 🔗 Resources

- 📖 **[Full Documentation](https://zustic.github.io/)** - Complete API reference and guides
- 🐛 **[GitHub Issues](https://github.com/DeveloperRejaul/zustic/issues)** - Report bugs and request features
- 💬 **[Discussions](https://github.com/DeveloperRejaul/zustic/discussions)** - Ask questions and share ideas
- 📦 **[NPM Package](https://npm.im/zustic)** - Install and view package info

---

## 📝 API Reference

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request to the [GitHub repository](https://github.com/DeveloperRejaul/zustic).

---

## 📄 License

MIT License © 2024 [Rejaul Karim](https://github.com/DeveloperRejaul)

---

## 👨‍💻 Author

Created by **Rejaul Karim** - [GitHub](https://github.com/DeveloperRejaul)

---

<div align="center">

### Made with ❤️ for the React community

⭐ Star us on [GitHub](https://github.com/DeveloperRejaul/zustic) if you find this helpful!

</div>
