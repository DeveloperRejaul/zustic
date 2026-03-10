import { useCounter } from "./counerStore";

export function Increment () {
   const {inc} = useCounter();
  return  <button onClick={inc}>Increment</button>
}