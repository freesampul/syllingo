import {readObject} from '@/lib/auth';
import {assertSameOrigin,requireMember,adminClient,dbCheck,HttpError} from '@/lib/auth';
import {failure} from '@/lib/server';
import {COURSE_ID} from '@/lib/account-config';
import {privateJson} from '@/lib/auth';
export async function POST(r:Request){try{assertSameOrigin(r);const {user}=await requireMember();const b=await readObject(r);if(typeof b.eventId!=='string'||!/^[-0-9a-f]{36}$/i.test(b.eventId)||typeof b.id!=='string'||b.id.length>100||!['recognition','production'].includes(b.skill)||!['again','hard','good'].includes(b.rating)||!(b.answer===null||typeof b.answer==='string'&&b.answer.length<=2000))throw new HttpError(400,'Invalid review.');const {data,error}=await adminClient().rpc('record_review',{p_event:b.eventId,p_user:user.id,p_course:COURSE_ID,p_item:b.id,p_skill:b.skill,p_rating:b.rating,p_answer:b.answer});dbCheck(error);return privateJson(data);}catch(e){return failure(e);}}
