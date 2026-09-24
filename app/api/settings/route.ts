import {parseComplexity} from '@/lib/sentence-complexity';
import {readObject} from '@/lib/auth';
import {parseScope,grammarTargets} from '@/lib/practice-scope';
import {entries,failure} from '@/lib/server';
import {COURSE_ID} from '@/lib/account-config';
import {assertSameOrigin,requireMember,adminClient,dbCheck,privateJson} from '@/lib/auth';
export async function GET(){try{const {user,client}=await requireMember();const {data,error}=await client.from('study_settings').select('genki_through,include_hiyaku,grammar_group,target,direction,complexity').eq('course_id',COURSE_ID).eq('user_id',user.id).maybeSingle();dbCheck(error);return privateJson(data?{scope:{genkiThrough:data.genki_through,includeHiyaku:data.include_hiyaku},group:data.grammar_group,target:data.target,direction:data.direction,complexity:parseComplexity(data.complexity)}:null);}catch(e){return failure(e);}}
export async function POST(r:Request){try{assertSameOrigin(r);const {user}=await requireMember();const b=await readObject(r),scope=parseScope(b.scope),complexity=parseComplexity(b.complexity);if(!['en-ja','ja-en'].includes(b.direction))throw Error('Invalid translation direction.');grammarTargets(await entries(),b.group,b.target);const {error}=await adminClient().from('study_settings').upsert({course_id:COURSE_ID,user_id:user.id,genki_through:scope.genkiThrough,include_hiyaku:scope.includeHiyaku,grammar_group:b.group,target:b.target,direction:b.direction,complexity,updated_at:new Date().toISOString()});dbCheck(error);return privateJson({saved:true});}catch(e){return failure(e);}}

export const dynamic = 'force-dynamic';
