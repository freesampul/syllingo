import {env} from "cloudflare:workers";
import {type Entry} from "./course";
import textbook from "./textbook.json";
import extra from "./quizlet-extra.json";
export function db(){return env.DB as D1Database;}
export async function entries(){const r=await db().prepare("SELECT data FROM entries").all<{data:string}>();const map=new Map<string,Entry>(([...textbook,...extra] as Entry[]).map(e=>[e.id,e]));for(const row of r.results){const e=JSON.parse(row.data);map.set(e.id,e);}return [...map.values()];}
export function originGuard(r:Request){const origin=r.headers.get("origin");if(origin&&origin!==new URL(r.url).origin)throw Error("Request origin is not allowed.");}
export function failure(e:unknown){console.error(e instanceof Error?e.message:"Request failed");return Response.json({error:e instanceof Error?e.message:"Request failed"},{status:400});}
