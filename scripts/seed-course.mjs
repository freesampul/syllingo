// Run after the SQL migration. Uses server-only credentials from .env.local.
// No keys, tokens, or student data are printed.
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
try{process.loadEnvFile('.env.local');}catch{}
const {SUPABASE_URL,SUPABASE_SECRET_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw Error('Set Supabase server credentials before seeding.');
const client=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const course='9a684d50-2772-43bf-9a5b-1d7e0a399153';
const {error:courseError}=await client.from('courses').upsert({id:course,slug:'hiyaku-1',title:'Hiyaku · Chapter 1 + Genki I & II',language_code:'ja'},{onConflict:'id',ignoreDuplicates:true});
if(courseError)throw Error('Could not create the course. Apply the migration first.');
let entries=['textbook','quizlet-extra','genki-vocab','grammar'].flatMap(name=>JSON.parse(readFileSync(new URL('../lib/'+name+'.json',import.meta.url),'utf8')));
// Optional export from the previous private app preserves owner-edited terms.
const overridePath=process.argv[2];if(overridePath){const overrides=JSON.parse(readFileSync(overridePath,'utf8'));const map=new Map(entries.map(e=>[e.id,e]));for(const e of overrides.entries||overrides)map.set(e.id,e);entries=[...map.values()];}
const units=[...new Set(entries.map(e=>e.lesson))].map(id=>({course_id:course,id,title:id==='1'?'Hiyaku · Chapter 1':id,position:id==='Genki expressions'?0:id.startsWith('Genki ')?Number(id.match(/\d+/)?.[0]||0):24}));
const {error:unitError}=await client.from('course_units').upsert(units,{onConflict:'course_id,id',ignoreDuplicates:true});if(unitError)throw Error('Course units could not be seeded.');
for(let start=0;start<entries.length;start+=200){const rows=entries.slice(start,start+200).map(e=>({course_id:course,id:e.id,unit_id:e.lesson,kind:e.kind,data:e}));const {error}=await client.from('learning_items').upsert(rows,{onConflict:'course_id,id',ignoreDuplicates:true});if(error)throw Error('Course entries could not be seeded.');}
console.log('Seed complete: '+entries.length+' entries available. Existing edits were preserved. Enrollment remains unchanged.');
