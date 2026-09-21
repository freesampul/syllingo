import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {accountConfig,accountsConfigured,appOrigin,COURSE_ID} from './account-config';

export class HttpError extends Error {status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export async function authClient(){
 if(!accountsConfigured())throw new HttpError(503,'Account setup is not finished yet. You can browse the class library in the meantime.');
 const c=accountConfig(),jar=await cookies();
 return createServerClient(c.SUPABASE_URL!,c.SUPABASE_PUBLISHABLE_KEY!,{
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:appOrigin().startsWith('https://'),path:'/'},
  cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options} of values)jar.set(name,value,options);}},
 });
}
// Never import this module into client components. The service key bypasses RLS;
// every use must follow verified identity + explicit course/record ownership checks.
export function adminClient(){const c=accountConfig();if(!accountsConfigured())throw new HttpError(503,'Account setup is not finished yet.');return createClient(c.SUPABASE_URL!,c.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
export async function optionalUser(){if(!accountsConfigured())return null;const client=await authClient();const {data,error}=await client.auth.getUser();if(error||!data.user)return null;return data.user;}
export async function requireUser(){const user=await optionalUser();if(!user)throw new HttpError(accountsConfigured()?401:503,accountsConfigured()?'Sign in with Google to save your practice.':'Account setup is not finished yet.');return user;}
export async function requireMember(){const user=await requireUser();const client=await authClient();const {data,error}=await client.from('course_memberships').select('role').eq('course_id',COURSE_ID).eq('user_id',user.id).maybeSingle();if(error)throw new HttpError(503,'Your course could not be loaded. Please try again.');if(!data)throw new HttpError(403,'Join the class to start practicing.');return {user,role:data.role as 'owner'|'teacher'|'student',client};}
export async function requireEditor(){const member=await requireMember();if(!['owner','teacher'].includes(member.role))throw new HttpError(403,'Only the course owner or teacher can change class material.');return member;}
export function assertSameOrigin(r:Request){if(!accountsConfigured())throw new HttpError(503,'Account setup is not finished yet.');if(r.headers.get('origin')!==appOrigin())throw new HttpError(403,'Request origin is not allowed.');}
export function privateJson(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});}
export function accountFailure(e:unknown){if(e instanceof HttpError)return privateJson({error:e.message},e.status);console.error('Account operation failed');return privateJson({error:'Your changes could not be saved. Please try again.'},503);}
export function dbCheck(error:unknown){if(error)throw new HttpError(503,'Your practice could not be saved. Please try again.');}
export async function reserveAI(userId:string,units:number){const {data,error}=await adminClient().rpc('reserve_ai_usage',{p_user:userId,p_course:COURSE_ID,p_units:units});dbCheck(error);if(!data)throw new HttpError(429,'The daily AI practice allowance has been reached. Flashcards are still available; try sentence practice tomorrow.');}

export async function readObject(r:Request):Promise<Record<string,any>>{const text=await r.text();if(text.length>12000)throw new HttpError(413,'Request is too large.');let body:unknown;try{body=JSON.parse(text);}catch{throw new HttpError(400,'Invalid request.');}if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Invalid request.');return body as Record<string,any>;}
