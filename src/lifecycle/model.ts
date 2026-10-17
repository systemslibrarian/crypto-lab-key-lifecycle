import {newKey, seal, open, copiedKey, type SealedRecord,hex} from '../crypto/aead.ts';
export type Incident={message:string;authenticated:boolean;confidentialityLost:boolean};
export class KeyLifecycle{
  keys=new Map<number,CryptoKey>();
  used=new Set<string>();
  records:SealedRecord[]=[];
  archived?:SealedRecord;
  attackerKey?:CryptoKey;
  epoch=0;
  compromised=false;
  revoked=false;
  log:string[]=[];
  get ready(){return this.epoch!==0;}
  get rotated(){return this.epoch>1;}
  async prepare(){if(this.ready)throw new Error('Scenario already prepared');
    this.epoch=1;this.keys.set(1,await newKey());
    for(const id of ['Aisle-17','Archive-42','Hold-23'])this.records.push(await seal(this.keys.get(1)!,id,1,this.used));
    this.log.push('Three fictional records encrypted with active Key A (epoch 1).');
  }
  async rotate(){if(!this.ready)throw new Error('Prepare records first');if(this.rotated)throw new Error('Active writer key already rotated');
    this.epoch=2;this.keys.set(2,await newKey());this.log.push('Key B active for new encryption. Existing ciphertext remains under A.');
  }
  async compromise(){if(!this.rotated)throw new Error('Rotate Key B first');if(this.attackerKey)throw new Error('Attacker already holds a copied key');
    const key=this.keys.get(1);if(!key)throw new Error('Historical key unavailable');
    this.attackerKey=await copiedKey(key);this.archived={...this.records[0]!,iv:this.records[0]!.iv.slice(),aad:this.records[0]!.aad.slice(),ciphertext:this.records[0]!.ciphertext.slice()};
    this.compromised=true;this.log.push('Attacker captured Key A and an old ciphertext; captured copies cannot be recalled.');
  }
  async attackDecrypt():Promise<Incident>{if(!this.attackerKey||!this.archived)throw new Error('No copied key and ciphertext');
    const message=await open(this.attackerKey,this.archived);
    this.log.push('Attacker actually decrypted captured epoch-1 data. AES-GCM authenticated correctly.');
    return {message,authenticated:true,confidentialityLost:true};
  }
  async reencrypt(){if(!this.rotated)throw new Error('Rotate first');let n=0;
    const result:SealedRecord[]=[];
    for(const rec of this.records){
      const old=this.keys.get(rec.epoch);if(!old)throw new Error('Missing historical key; re-encryption stopped');
      await open(old,rec); // authenticates actual original, fail-closed
      result.push(await seal(this.keys.get(2)!,rec.id,2,this.used));n++;
    }
    this.records=result;this.log.push(n+' remaining records re-encrypted under Key B; attacker retains earlier snapshot.');
  }
  async retire(){if(!this.rotated)throw new Error('Rotate before retirement');this.keys.delete(1);this.revoked=true;this.log.push('Key A discarded from the training model. The attacker still holds their copy.');}
  async read(rec:SealedRecord){const key=this.keys.get(rec.epoch);if(!key)throw new Error('Historical key unavailable');return open(key,rec);}
  async tamperTrial(){if(!this.ready)throw new Error('Prepare first');const rec=this.records[0]!;
    const altered={...rec,ciphertext:rec.ciphertext.slice()};altered.ciphertext[0]=(altered.ciphertext[0]??0)^1;
    try{await this.read(altered);return false;}catch{return true;}
  }
  view(){return this.records.map(r=>({id:r.id,epoch:r.epoch,cipherBytes:r.ciphertext.length,iv:hex(r.iv).slice(0,12),readable:this.keys.has(r.epoch)}));}
}
