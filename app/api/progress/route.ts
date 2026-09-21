import {requireMember,dbCheck,privateJson} from '@/lib/auth';
import {COURSE_ID} from '@/lib/account-config';
import {failure} from '@/lib/server';
export async function GET(r:Request){try{const {user,client}=await requireMember();const offset=Math.max(0,Math.min(100000,Number(new URL(r.url).searchParams.get('offset'))||0));const results=await Promise.all([
 client.rpc('practice_summary',{p_course:COURSE_ID}),
 client.from('practice_attempts').select('id,answer,assisted,feedback,created_at,practice_exercises(content,direction)').eq('course_id',COURSE_ID).eq('user_id',user.id).eq('status','complete').order('created_at',{ascending:false}).range(offset,offset+19),
 client.from('review_events').select('id,item_snapshot,skill,rating,answer,created_at').eq('course_id',COURSE_ID).eq('user_id',user.id).order('created_at',{ascending:false}).range(offset,offset+19),
 ]);for(const result of results)dbCheck(result.error);return privateJson({summary:results[0].data,sentences:results[1].data,reviews:results[2].data,offset});}catch(e){return failure(e);}}

export const dynamic = 'force-dynamic';
