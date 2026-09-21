import {env} from 'cloudflare:workers';
type Config={OPENAI_API_KEY?:string;OPENAI_MODEL?:string;OPENAI_KEY_ENVELOPE?:string;OPENAI_KEY_WRAP_KEY?:string};
export const aiConfig=()=>env as unknown as Config;
export const connected=()=>{const c=aiConfig();return !!c.OPENAI_MODEL&&!!(c.OPENAI_API_KEY||(c.OPENAI_KEY_ENVELOPE&&c.OPENAI_KEY_WRAP_KEY));};
async function key(){const c=aiConfig();if(c.OPENAI_API_KEY)return c.OPENAI_API_KEY;if(!c.OPENAI_KEY_ENVELOPE||!c.OPENAI_KEY_WRAP_KEY)throw Error('AI practice is not connected yet.');const decode=(s:string)=>Uint8Array.from(atob(s),v=>v.charCodeAt(0));const envelope=JSON.parse(c.OPENAI_KEY_ENVELOPE);const k=await crypto.subtle.importKey('raw',decode(c.OPENAI_KEY_WRAP_KEY),'AES-GCM',false,['decrypt']);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv)},k,decode(envelope.ciphertext)));}
export async function ai(instructions:string,input:unknown,schema:unknown,max=1800){
 const secret=await key();const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:aiConfig().OPENAI_MODEL,store:false,max_output_tokens:max,reasoning:{effort:'low'},instructions,input:JSON.stringify(input),text:{format:{type:'json_schema',name:'course_practice',strict:true,schema}}})});
 if(!r.ok){if(r.status===401)throw Error('The AI key was rejected. The connection needs updating.');if(r.status===429)throw Error('The AI service has reached a usage or billing limit. Please check API billing or try again later.');throw Error('The AI service is temporarily unavailable. Please try again.');}
 const body=await r.json() as {output?:{content?:{type:string;text?:string}[]}[]};const text=body.output?.flatMap(o=>o.content||[]).find(v=>v.type==='output_text')?.text;if(!text)throw Error('No complete exercise returned. Please try again.');return JSON.parse(text);
}
export const objectSchema=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
