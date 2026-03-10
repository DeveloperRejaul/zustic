import { useCounter } from "./counerStore";

export default function Reset () {
   const {reset } = useCounter();
  return  <button onClick={reset}>Reset</button>
}