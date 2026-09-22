'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
export type Account={configured:boolean;user:{id:string;name:string;email:string}|null;role:'owner'|'teacher'|'student'|null};
export default function AccountPanel({account,loading,error,onRetry}:{account:Account;loading:boolean;error:string;onRetry:()=>void}){
 const [busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
 async function action(action:string){setBusy(true);setActionError('');try{const r=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const d=await r.json() as {error?:string};if(!r.ok)throw Error(d.error||'Please try again.');window.location.assign('/');}catch(e){setActionError(e instanceof Error?e.message:'Please try again.');setBusy(false);}}
 return <section className="account-strip" aria-label="Your account">
 <div>{loading?<strong>Loading your account…</strong>:error?<><strong>Your account couldn’t be loaded</strong><p>{error}</p></>:account.user?<><strong>{account.user.name}</strong><p>{account.role?'Your progress is saved privately to your account.':'Join the class to save your practice and progress.'}</p></>:<><strong>{account.configured?'Your class. Your progress.':'Account setup in progress'}</strong><p>{account.configured?'Sign in to save reviews, sentence practice, and feedback across devices.':'You can browse the class library. Saved practice will be available once Google sign-in is connected.'}</p></>}</div>
 <div className="actions">{!loading&&(error?<Button variant="outline" onClick={onRetry}>Retry</Button>:account.user?<>{!account.role&&<Button disabled={busy} onClick={()=>action('join')}>{busy?'Joining…':'Join current course'}</Button>}<Button variant="outline" disabled={busy} onClick={()=>action('signout')}>Sign out</Button></>:account.configured?<a className="google-signin" href="/auth/signin" target="_top">Continue with Google</a>:<Button disabled>Google sign-in · Not connected</Button>)}</div>
 {actionError&&<p role="alert" className="error">{actionError}</p>}
 </section>;
}
