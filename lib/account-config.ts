import {env} from 'cloudflare:workers';

export const COURSE_ID = '9a684d50-2772-43bf-9a5b-1d7e0a399153';
type AccountConfig = {SUPABASE_URL?:string; SUPABASE_PUBLISHABLE_KEY?:string; SUPABASE_SECRET_KEY?:string; APP_ORIGIN?:string};
export function accountConfig(){return env as unknown as AccountConfig;}
export function accountsConfigured(){const c=accountConfig();return !!(c.SUPABASE_URL&&c.SUPABASE_PUBLISHABLE_KEY&&c.SUPABASE_SECRET_KEY&&c.APP_ORIGIN);}
export function appOrigin(){const value=accountConfig().APP_ORIGIN;if(!value)throw new Error('Account setup is not finished yet.');const u=new URL(value);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&u.hostname==='localhost'))throw new Error('Invalid application origin.');return u.origin;}
