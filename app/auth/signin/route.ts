import {authClient,accountFailure} from '@/lib/auth';
import {appOrigin} from '@/lib/account-config';
export async function GET(){try{const client=await authClient();const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:appOrigin()+'/auth/callback',skipBrowserRedirect:true,scopes:'openid email profile'}});if(error||!data.url)return Response.redirect(appOrigin()+'/?auth_error=signin',303);return new Response(null,{status:303,headers:{Location:data.url,'Cache-Control':'no-store'}});}catch(e){return accountFailure(e);}}
