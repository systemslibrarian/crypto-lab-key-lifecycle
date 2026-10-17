import {expect,test} from 'vitest';
import {KeyLifecycle} from './model.ts';
test('rotation does not change old ciphertext; actual attacker decrypt still succeeds after re-encryption and retirement',async()=>{
 const s=new KeyLifecycle();await s.prepare();const old=s.records[0]!.ciphertext.slice();await s.rotate();
 expect(s.records[0]!.epoch).toBe(1);expect(s.records[0]!.ciphertext).toEqual(old);
 await s.compromise();await s.reencrypt();expect(s.records.every(r=>r.epoch===2)).toBe(true);
 expect(await s.read(s.records[0]!)).toContain('epoch 1'); await s.retire();const disclosure=await s.attackDecrypt();expect(disclosure.authenticated).toBe(true);expect(disclosure.confidentialityLost).toBe(true);
 expect(disclosure.message).toContain('epoch 1');
});
test('invalid state transitions and tamper never pass silently',async()=>{const s=new KeyLifecycle();await expect(s.rotate()).rejects.toThrow();await s.prepare();
 await expect(s.prepare()).rejects.toThrow();await s.rotate();await expect(s.rotate()).rejects.toThrow();
 expect(await s.tamperTrial()).toBe(true);await s.retire();await expect(s.read(s.records[0]!)).rejects.toThrow(/Historical key/);
});
