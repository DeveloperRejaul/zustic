import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {create, type Middleware} from 'zustic'

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

function App() {
  const {count, inc} = useCounter()

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
          inc()
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
