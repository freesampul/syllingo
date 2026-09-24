import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
function compile(file,replacements={}){let code=ts.transpileModule(readFileSync(new URL(file,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;for(const [from,to] of Object.entries(replacements))code=code.replaceAll(`from '${from}'`,`from '${to}'`).replaceAll(`from "${from}"`,`from "${to}"`);return url(code);}
const scopeUrl=compile('lib/practice-scope.ts');
const complexityUrl=compile('lib/sentence-complexity.ts',{'./practice-scope':scopeUrl});
const {parseComplexity,complexityBrief,supportingGrammar,auditedGrammar}=await import(complexityUrl);
const all=['textbook','quizlet-extra','genki-vocab','grammar'].flatMap(f=>JSON.parse(readFileSync(new URL('lib/'+f+'.json',root),'utf8')));
const target=all.find(g=>g.id.startsWith('hiyaku-grammar-'));
const allowed=supportingGrammar(all,'hiyaku-1');
const support=allowed.find(g=>g.id.startsWith('genki-grammar-'));

test('complexity defaults, validation, and grammar chapter boundaries',()=>{
 assert.equal(parseComplexity(undefined),'focused');for(const value of ['easy',null,{},3])assert.throws(()=>parseComplexity(value));
 assert.equal(parseComplexity('worksheet'),'worksheet');assert.equal(complexityBrief('worksheet').max,3);
 const genki=supportingGrammar(all,'genki-2');assert.ok(genki.length);assert.ok(genki.every(g=>['Genki 01','Genki 02'].includes(g.lesson)));assert.ok(!genki.some(g=>g.id===target.id));
 assert.ok(allowed.some(g=>g.id===target.id));
});
test('audit requires distinct real patterns, primary target, and requested count',()=>{
 assert.equal(auditedGrammar([target.id],allowed,target.id,'focused').length,1);
 assert.throws(()=>auditedGrammar([target.id,target.id],allowed,target.id,'connected'));
 assert.throws(()=>auditedGrammar([support.id],allowed,target.id,'focused'));
 assert.throws(()=>auditedGrammar([target.id,'fake'],allowed,target.id,'worksheet'));
 assert.throws(()=>auditedGrammar([target.id,support.id],allowed,target.id,'focused'));
 assert.deepEqual(auditedGrammar([support.id,target.id],allowed,target.id,'worksheet').map(g=>g.id),[target.id,support.id]);
});

// Exercise the real route with controlled AI responses and storage, without billable calls.
const mocks=url(`
 export const COURSE_ID='test-course';
 export const aiConfig=()=>({OPENAI_MODEL:'test-model'});
 export const connected=()=>true;
 export const objectSchema=properties=>({type:'object',properties});
 export const requireMember=async()=>({user:{id:'test-user'}});
 export const assertSameOrigin=()=>{};
 export const readObject=r=>r.json();
 export const reserveAI=async(user,n)=>globalThis.__sentence.reservations.push(n);
 export const privateJson=data=>Response.json(data);
 export const dbCheck=e=>{if(e)throw e};
 export const adminClient=()=>({from:()=>({insert:row=>{globalThis.__sentence.saved.push(row);return {select:()=>({single:async()=>({data:{id:'saved-id'},error:null})})}}})});
 export const entries=async()=>globalThis.__sentence.all;
 export const failure=e=>Response.json({error:e.message},{status:400});
 export const ai=async(instructions,input,schema)=>{globalThis.__sentence.calls.push({instructions,input,schema});return globalThis.__sentence.responses.shift();};
`);
const routeUrl=compile('app/api/sentence/route.ts',{'@/lib/sentence-complexity':complexityUrl,'@/lib/practice-scope':scopeUrl,'@/lib/examples':compile('lib/examples.ts'),'@/lib/japanese':compile('lib/japanese.ts'),'@/lib/auth':mocks,'@/lib/account-config':mocks,'@/lib/ai':mocks,'@/lib/server':mocks});
const route=await import(routeUrl);
for(const direction of ['en-ja','ja-en'])test('generation saves audited patterns and complexity for '+direction,async()=>{
 const fixture={id:'fixture',term:'わたし',reading:'わたし',definition:'I',kind:'vocabulary',lesson:'1',source:'test',notes:'',forms:''};
 const t={...fixture,id:'target',kind:'grammar',term:'XはYです'};const extra={...t,id:'genki-grammar-test',lesson:'Genki 01',term:'〜か'};
 globalThis.__sentence={all:[fixture,t,extra],saved:[],calls:[],reservations:[],responses:[{japanese:'わたしです。',translation:'It is me.'},{allowed:true,complexityMet:true,explanation:'Two patterns.',grammarIds:['target','genki-grammar-test']}]};
 const r=await route.POST(new Request('https://syllingo.com/api/sentence',{method:'POST',body:JSON.stringify({direction,target:'target',grammarGroup:'class',complexity:'connected'})}));
 assert.equal(r.status,200);const d=await r.json();assert.equal(d.complexity,'connected');assert.equal(d.targets.length,2);assert.equal(d.grammar.length,2);assert.equal(d.direction,direction);
 assert.equal(globalThis.__sentence.saved[0].content.complexity,'connected');assert.equal(globalThis.__sentence.calls[1].input.complexityRequirements.min,2);assert.deepEqual(globalThis.__sentence.reservations,[4]);
});
test('too-simple audits retry and never save an unchecked worksheet',async()=>{
 const fixture={id:'fixture',term:'わたし',reading:'わたし',definition:'I',kind:'vocabulary',lesson:'1',source:'test',notes:'',forms:''};const t={...fixture,id:'target',kind:'grammar',term:'XはYです'};
 globalThis.__sentence={all:[fixture,t],saved:[],calls:[],reservations:[],responses:Array.from({length:2},()=>[{japanese:'わたしです。',translation:'It is me.'},{allowed:true,complexityMet:true,explanation:'Only target.',grammarIds:['target']}]).flat()};
 const r=await route.POST(new Request('https://syllingo.com/api/sentence',{method:'POST',body:JSON.stringify({direction:'en-ja',target:'target',grammarGroup:'class',complexity:'worksheet'})}));
 assert.equal(r.status,400);assert.equal(globalThis.__sentence.saved.length,0);assert.equal(globalThis.__sentence.calls.length,4);assert.match(globalThis.__sentence.calls[2].input.previousIssue,/complexity/);
});

test('settings round-trip saves complexity under the authenticated user',async()=>{
 const settingsMocks=url(`export const COURSE_ID='course';export const readObject=r=>r.json();export const assertSameOrigin=()=>{};export const dbCheck=e=>{if(e)throw e};export const privateJson=d=>Response.json(d);export const failure=e=>Response.json({error:e.message},{status:400});export const entries=async()=>globalThis.__settings.entries;const chain={eq:()=>chain,maybeSingle:async()=>({data:globalThis.__settings.row})};export const requireMember=async()=>({user:{id:'user'},client:{from:()=>({select:()=>chain})}});export const adminClient=()=>({from:()=>({upsert:async row=>{globalThis.__settings.row=row;return {error:null}}})});`);
 const route=await import(compile('app/api/settings/route.ts',{'@/lib/sentence-complexity':complexityUrl,'@/lib/practice-scope':scopeUrl,'@/lib/auth':settingsMocks,'@/lib/server':settingsMocks,'@/lib/account-config':settingsMocks}));
 globalThis.__settings={entries:all,row:null};
 for(const complexity of ['worksheet','connected','focused']){
  const r=await route.POST(new Request('https://example.test',{method:'POST',body:JSON.stringify({scope:{genkiThrough:22,includeHiyaku:true},group:'hiyaku-1',target:target.id,direction:'ja-en',complexity})}));assert.equal(r.status,200);
  const saved=await (await route.GET()).json();assert.equal(saved.complexity,complexity);assert.equal(saved.scope.genkiThrough,22);assert.equal(globalThis.__settings.row.user_id,'user');
 }
 const before=globalThis.__settings.row;assert.equal((await route.POST(new Request('https://example.test',{method:'POST',body:JSON.stringify({complexity:'invalid'})}))).status,400);assert.equal(globalThis.__settings.row,before);
});

test('grading passes all patterns to tutor and cannot mark missing grammar fully correct',async()=>{
 const exercise={id:'exercise',direction:'en-ja',target_id:target.id,content:{target,targets:[target,support],complexity:'worksheet',translation:'prompt',japanese:'reference'}};
 const mocks=url(`export const COURSE_ID='course';export const readObject=r=>r.json();export const assertSameOrigin=()=>{};export const dbCheck=e=>{if(e)throw e};export const privateJson=d=>Response.json(d);export const failure=e=>Response.json({error:e.message},{status:400});export class HttpError extends Error{};export const reserveAI=async()=>{};export const objectSchema=p=>p;export const entries=async()=>globalThis.__grading.all;const chain={eq:()=>chain,maybeSingle:async()=>({data:globalThis.__grading.exercise})};export const requireMember=async()=>({user:{id:'user'},client:{from:()=>({select:()=>chain})}});export const adminClient=()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})}),insert:async()=>({error:null}),update:data=>{globalThis.__grading.saved=data;const c={eq:()=>c};return c;}})});export const ai=async(instructions,input)=>{globalThis.__grading.input=input;return {targetGrammarUsed:false,verdict:'correct',feedback:'Missing a supporting pattern.',correction:'reference',tip:'Include both patterns.'};};`);
 const route=await import(compile('app/api/feedback/route.ts',{'@/lib/auth':mocks,'@/lib/server':mocks,'@/lib/account-config':mocks,'@/lib/ai':mocks}));
 for(const direction of ['en-ja','ja-en']){
  globalThis.__grading={all,exercise:{...exercise,direction}};
  const r=await route.POST(new Request('https://example.test',{method:'POST',body:JSON.stringify({exerciseId:'exercise',answer:'answer',attemptId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',assisted:false})}));
  assert.equal(r.status,200);const result=await r.json();assert.equal(result.verdict,direction==='en-ja'?'partly_correct':'correct');assert.equal(globalThis.__grading.input.requiredGrammar.length,2);assert.equal(globalThis.__grading.input.complexity,'worksheet');assert.equal(globalThis.__grading.saved.status,'complete');
 }
 // Exercises created before this change still grade against their one stored target.
 globalThis.__grading={all,exercise:{...exercise,content:{target,translation:'prompt',japanese:'reference'}}};
 await route.POST(new Request('https://example.test',{method:'POST',body:JSON.stringify({exerciseId:'exercise',answer:'answer',attemptId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',assisted:false})}));assert.equal(globalThis.__grading.input.requiredGrammar.length,1);
});
