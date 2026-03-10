import { useCounter } from "./counerStore";

export default function Decrement () {
   const { dec,} = useCounter();
  return  <button onClick={dec}>Decrement</button>
}
