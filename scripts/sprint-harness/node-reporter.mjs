// Consume Node's trusted test-event stream, not text printed by test scripts.
export default async function* report(source){
 for await(const event of source){
  yield JSON.stringify(event,(key,value)=>value instanceof Error?Object.fromEntries(Object.getOwnPropertyNames(value).map(k=>[k,value[k]])):value)+'\n';
 }
}
