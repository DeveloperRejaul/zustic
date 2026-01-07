# Zustic

A lightweight, minimal state management library for React using `useSyncExternalStore`. Perfect for managing global state in React, React Native, and Next.js applications.

[![npm](https://img.shields.io/npm/v/zustic)](https://www.npmjs.com/package/zustic)
[![license](https://img.shields.io/npm/l/zustic)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zustic)](https://bundlephobia.com/package/zustic)

## Features

✨ **Lightweight** - Minimal footprint with zero dependencies (except React)  
⚡ **Simple API** - Intuitive and easy to learn state management  
🎣 **React Hooks** - Use hooks to access state in your components  
📱 **Multi-Platform** - Works with React, React Native, and Next.js  
🔄 **Reactive Updates** - Automatic re-renders on state changes  
💾 **TypeScript Support** - Full TypeScript support with type safety  
🚀 **Production Ready** - Optimized for performance and reliability  

## Installation

```bash
npm install zustic
```

or with yarn:

```bash
yarn add zustic
```

or with pnpm:

```bash
pnpm add zustic
```

## Quick Start

### Basic Usage

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

### Using in React Components

```typescript
import { useCounter } from './store';

function Counter() {
  const { count, inc, dec, reset } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={inc}>Increment</button>
      <button onClick={dec}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;
```

## API Reference

### `create<T>(initializer)`

Creates a new store with the given state and actions.

#### Parameters

- **initializer** `(set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void) => T`
  - A function that receives the `set` function and returns the initial state object
  - The `set` function accepts either a partial state object or a function that takes the current state and returns a partial state object

#### Returns

A React hook function that provides access to the store state.

#### Type Parameters

- **T** `extends object` - The shape of your store state

## Advanced Examples

### 1. Combining Multiple Stores

```typescript
import { create } from 'zustic';

// User store
export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

// Todos store
export const useTodosStore = create<TodosStore>((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({ 
    todos: [...state.todos, todo] 
  })),
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter(t => t.id !== id)
  })),
}));

// Use both in a component
function App() {
  const user = useUserStore();
  const todos = useTodosStore();
  
  return (
    <>
      <User />
      <TodoList />
    </>
  );
}
```

### 2. Complex State Updates

```typescript
const useShopStore = create<ShopStore>((set) => ({
  items: [],
  cart: [],
  total: 0,
  
  addToCart: (item) => set((state) => ({
    cart: [...state.cart, item],
    total: state.total + item.price,
  })),
  
  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== itemId),
    total: state.total - state.cart.find(item => item.id === itemId)?.price || 0,
  })),
  
  clearCart: () => set({
    cart: [],
    total: 0,
  }),
}));
```

### 3. Computed Values

```typescript
const useStatsStore = create<StatsStore>((set) => ({
  scores: [],
  
  addScore: (score) => set((state) => ({
    scores: [...state.scores, score],
  })),
  
  // You can compute values directly in the component
  // or create selector functions
  getAverage: (state) => {
    if (state.scores.length === 0) return 0;
    return state.scores.reduce((a, b) => a + b, 0) / state.scores.length;
  },
}));

function Stats() {
  const { scores, addScore, getAverage } = useStatsStore();
  const average = getAverage(useStatsStore());
  
  return <div>Average: {average}</div>;
}
```

### 4. Next.js Usage

```typescript
// store/counterStore.ts
import { create } from 'zustic';

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

```typescript
// app/page.tsx
'use client';

import { useCounterStore } from '@/store/counterStore';

export default function Home() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <main>
      <h1>Count: {count}</h1>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </main>
  );
}
```

### 5. React Native Usage

```typescript
import { create } from 'zustic';
import { View, Text, TouchableOpacity } from 'react-native';

const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));

function App() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
      <Text>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Best Practices

### 1. **Organize Stores**
Keep your stores organized in a dedicated directory:

```
src/
├── stores/
│   ├── counterStore.ts
│   ├── userStore.ts
│   └── index.ts
└── components/
```

### 2. **Type Your Store**
Always define proper TypeScript types for better type safety:

```typescript
interface CounterState {
  count: number;
  inc: () => void;
  dec: () => void;
}

export const useCounter = create<CounterState>((set) => ({
  count: 0,
  inc: () => set((state) => ({ count: state.count + 1 })),
  dec: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 3. **Keep State Flat**
Try to keep your state structure as flat as possible for better performance:

```typescript
// ❌ Avoid deeply nested structures
const state = { user: { profile: { settings: { theme: 'dark' } } } };

// ✅ Prefer flat structures
const state = { userTheme: 'dark' };
```

### 4. **Use Immutable Updates**
Always return new objects instead of mutating state:

```typescript
// ❌ Bad - mutating state
set((state) => {
  state.items.push(newItem);
  return state;
});

// ✅ Good - immutable updates
set((state) => ({
  items: [...state.items, newItem],
}));
```

## Performance Tips

1. **Minimize Subscriptions** - Only subscribe to the parts of the state you need
2. **Use Memoization** - Memoize components that depend on store state
3. **Avoid Large Objects** - Split large stores into multiple smaller ones
4. **Batch Updates** - Group related state updates together

## Browser Support

Zustic works in all modern browsers that support ES6 and React 16.8+.

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supporting React Native

## Comparison

| Feature | Zustic | Zustand | Redux | Context API |
|---------|--------|---------|-------|-------------|
| Bundle Size | ~500B | ~2KB | ~7KB | - |
| Learning Curve | Very Easy | Easy | Hard | Medium |
| Boilerplate | Minimal | Minimal | Lots | Medium |
| DevTools | No | Yes | Yes | No |
| Middleware | No | Yes | Yes | No |
| TypeScript | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### State not updating?
Make sure you're using the `set` function correctly. Always return a new object:

```typescript
// ❌ Wrong
set({ count: state.count + 1 }); // state is undefined here

// ✅ Correct
set((state) => ({ count: state.count + 1 }));
```

### Component not re-rendering?
Ensure you're using the hook at the top level of your component:

```typescript
// ❌ Bad
if (condition) {
  const state = useStore();
}

// ✅ Good
const state = useStore();
```

## Migration Guide

### From Context API

Before:
```typescript
const CounterContext = createContext();

export function CounterProvider({ children }) {
  const [count, setCount] = useState(0);
  
  return (
    <CounterContext.Provider value={{ count, setCount }}>
      {children}
    </CounterContext.Provider>
  );
}

function useCounter() {
  return useContext(CounterContext);
}
```

After:
```typescript
export const useCounter = create((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
```

### From Redux

Before:
```typescript
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => { state.count += 1; },
  },
});

export const { increment } = counterSlice.actions;
export default useSelector((state) => state.counter);
```

After:
```typescript
export const useCounter = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC © 2024 [Rejaul Karim](https://github.com/DeveloperRejaul)

## Support

- 📖 [Documentation](https://github.com/DeveloperRejaul/zustic)
- 🐛 [Bug Reports](https://github.com/DeveloperRejaul/zustic/issues)
- 💬 [Discussions](https://github.com/DeveloperRejaul/zustic/discussions)

## Related Projects

- [Zustand](https://github.com/pmndrs/zustand) - A small, fast and scalable bearbones state-management solution
- [Jotai](https://github.com/pmndrs/jotai) - Primitive and flexible state management for React
- [Recoil](https://recoiljs.org/) - A state management library for React

## Changelog

### v1.0.0 (2024)
- Initial release
- Basic state management with `create` function
- TypeScript support
- React, React Native, and Next.js compatibility
