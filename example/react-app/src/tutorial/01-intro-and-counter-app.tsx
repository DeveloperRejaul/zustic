import { useCounter } from './counerStore';
import Decrement from './Decrement';
import { Increment } from './Increment';
import Reset from './Reset';


export default function Counter() {
  const count = useCounter((state) => state.count);

  return (
    <div className='flex flex-col'>
      <p className='text-center'>Count: {count}</p>
      <Increment/>
      <Decrement/>
      <Reset/>
    </div>
  );
}



