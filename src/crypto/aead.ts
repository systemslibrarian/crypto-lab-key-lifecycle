/** Browser-only AES-GCM teaching adapter. Never use demonstration keys for real data. */
export type SealedRecord={id:string;epoch:number;iv:Uint8Array;aad:Uint8Array;ciphertext:Uint8Array};
const enc=new TextEncoder();
export const hex=(u:Uint8Array)=>Array.from(u,b=>b.toString(16).padStart(2,'0')).join('');
export async function newKey():Promise<CryptoKey>{return crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);}
export function aadFor(id:string,epoch:number){return enc.encode(JSON.stringify(['key-lifecycle-v1',id,epoch]));}
export async function seal(key:CryptoKey,id:string,epoch:number,used:Set<string>,plaintext?:string):Promise<SealedRecord>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const marker=epoch+':'+hex(iv);
  if(used.has(marker))throw new Error('IV collision: encryption refused');
  used.add(marker);
  const aad=aadFor(id,epoch);
  const text=enc.encode(plaintext??('Fictional record for '+id+' (epoch '+epoch+')'));
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,text));
  return {id,epoch,iv,aad,ciphertext};
}
export async function open(key:CryptoKey,rec:SealedRecord):Promise<string>{
  // Recompute AAD independently from record identity rather than trusting a mutable field.
  const expected=aadFor(rec.id,rec.epoch);
  if(hex(rec.aad)!==hex(expected))throw new Error('Record identity or AAD does not match');
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(rec.iv),additionalData:new Uint8Array(expected),tagLength:128},key,new Uint8Array(rec.ciphertext)));
}
export async function copiedKey(key:CryptoKey):Promise<CryptoKey>{
  const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));
  try{return await crypto.subtle.importKey('raw',raw,{name:'AES-GCM',length:256},false,['decrypt']);}
  finally{raw.fill(0);} // best-effort buffer cleanup; not secure memory zeroization
}
