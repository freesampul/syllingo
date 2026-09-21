import {env} from "cloudflare:workers";
import {accountsConfigured,COURSE_ID} from "./account-config";
import {requireMember,HttpError,privateJson} from "./auth";
import {type Entry} from "./course";
import textbook from "./textbook.json";
import extra from "./quizlet-extra.json";
import genki from "./genki-vocab.json";
import grammar from "./grammar.json";
export function db(){return env.DB as D1Database;}
export const bundledEntries=()=>[...textbook,...extra,...genki,...grammar] as Entry[];
export async function entries(){
 if(!accountsConfigured())return bundledEntries();
 const {client}=await requireMember();const all:Entry[]=[];
 for(let offset=0;;offset+=1000){const {data,error}=await client.from('learning_items').select('data').eq('course_id',COURSE_ID).order('id').range(offset,offset+999);if(error)throw new HttpError(503,'The class library could not be loaded.');all.push(...data.map(row=>row.data as Entry));if(data.length<1000)break;}
 if(!all.length)throw new HttpError(503,'The class library is being prepared. Please try again later.');return all;
}
export function originGuard(r:Request){const origin=r.headers.get("origin");if(origin&&origin!==new URL(r.url).origin)throw Error("Request origin is not allowed.");}
export function failure(e:unknown){return privateJson({error:e instanceof Error?e.message:"Request failed"},e instanceof HttpError?e.status:400);}
