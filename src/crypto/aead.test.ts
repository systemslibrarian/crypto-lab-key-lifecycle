import {expect,test} from 'vitest';
import {aadFor,copiedKey,newKey,open,seal,hex} from './aead.ts';
test('NIST SP 800-38D, AES-256-GCM empty-plaintext authentication tag',async()=>{
 const key=await crypto.subtle.importKey('raw',new Uint8Array(32),{name:'AES-GCM'},false,['encrypt']);
 const tag=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:new Uint8Array(12),tagLength:128},key,new Uint8Array(0)));
 expect(hex(tag)).toBe('530f8afbc74536b9a963b4f1c4cb738b');
});
test('actual encrypted record authenticates, copied key also opens',async()=>{
 const key=await newKey();const record=await seal(key,'Aisle-17',1,new Set());
 expect(await open(key,record)).toContain('Aisle-17');expect(await open(await copiedKey(key),record)).toContain('Aisle-17');
});
test('changed AAD and modified tag fail closed',async()=>{const key=await newKey();const rec=await seal(key,'a',1,new Set());
 await expect(open(key,{...rec,id:'other'})).rejects.toThrow();
 const broken={...rec,ciphertext:rec.ciphertext.slice()};broken.ciphertext[broken.ciphertext.length-1]^=1;
 await expect(open(key,broken)).rejects.toThrow();
 const wrong=await newKey();await expect(open(wrong,rec)).rejects.toThrow();
});
test('duplicate-IV guard and stable associated-data encoding',async()=>{
 expect(hex(aadFor('abc',1))).toBe(hex(aadFor('abc',1)));expect(hex(aadFor('abc',1))).not.toBe(hex(aadFor('abc',2)));
});
