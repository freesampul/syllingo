import type {Entry} from './course';
export type Word={id:string;term:string;meaning:string;forms:Record<string,string>};
const clean=(s:string)=>s.replace(/\s*\([^)]*\)|\s*（[^）]*）/g,'').replace(/\[([^\]]*)\]/g,'$1').replace(/\s+/g,'').trim();
export function formsFor(e:Entry,kanji:Set<string>):Record<string,string>{
 const raw=clean(e.term),kana=clean(e.reading||e.term);
 if(!raw||/[〜～~／/;；［］]/.test(raw)||/[〜～~]/.test(kana))return {};
 const permitted=(s:string)=>[...s].every(c=>!/[\p{Script=Han}]/u.test(c)||kanji.has(c));
 const s=permitted(raw)?raw:kana;if(!permitted(s)||!s)return {};
 const f:Record<string,string>={dictionary:s};
 // These are the textbook's verb classes, not a guessed る-ending classification.
 const type=e.notes.includes('irr-v.')||/する$/.test(s)?'irr':e.notes.includes('ru-v.')||/Vi\/-ru|Vt\/-ru/.test(e.definition+' '+e.notes)?'ru':e.notes.includes('u-v.')||/Vi\/-u|Vt\/-u/.test(e.definition+' '+e.notes)?'u':'';
 const put=(stem:string,negative:string,te:string,past:string,volitional:string,potential:string,passive:string,causative:string)=>Object.assign(f,{stem,negative,negativePast:negative.slice(0,-1)+'かった',te,past,polite:stem+'ます',politePast:stem+'ました',politeNegative:stem+'ません',politeNegativePast:stem+'ませんでした',volitional,potential,passive,causative});
 if(type==='irr'&&s.endsWith('する')){const b=s.slice(0,-2);put(b+'し',b+'しない',b+'して',b+'した',b+'しよう',b+'できる',b+'される',b+'させる');}
 else if(kana==='くる'){const k=permitted('来')?'来':'';put(k?k:'き',k?k+'ない':'こない',k?k+'て':'きて',k?k+'た':'きた',k?k+'よう':'こよう',k?k+'られる':'こられる',k?k+'られる':'こられる',k?k+'させる':'こさせる');}
 else if(type==='ru'&&s.endsWith('る')){const b=s.slice(0,-1);put(b,b+'ない',b+'て',b+'た',b+'よう',b+'られる',b+'られる',b+'させる');}
 else if(type==='u'){
 const ends:Record<string,string[]>={'う':['い','わ','って','った','お'],'く':['き','か','いて','いた','こ'],'ぐ':['ぎ','が','いで','いだ','ご'],'す':['し','さ','して','した','そ'],'つ':['ち','た','って','った','と'],'ぬ':['に','な','んで','んだ','の'],'ぶ':['び','ば','んで','んだ','ぼ'],'む':['み','ま','んで','んだ','も'],'る':['り','ら','って','った','ろ']};
 const end=s.slice(-1),v=ends[end],b=s.slice(0,-1);if(v){const eRow:Record<string,string>={'う':'え','く':'け','ぐ':'げ','す':'せ','つ':'て','ぬ':'ね','ぶ':'べ','む':'め','る':'れ'};put(b+v[0],kana==='ある'?'ない':b+v[1]+'ない',b+(kana==='いく'?'って':v[2]),b+(kana==='いく'?'った':v[3]),b+v[4]+'う',b+eRow[end]+'る',b+v[1]+'れる',b+v[1]+'せる');}
 }
 if(f.past)f.pastConditional=f.past+'ら';
 if(f.negative)f.negativeConditional=f.negative.slice(0,-1)+'ければ';
 if(f.potential){f.conditional=type==='u'?f.potential.slice(0,-1)+'ば':s.slice(0,-1)+'れば';if(s.endsWith('する'))f.conditional=s.slice(0,-2)+'すれば';if(kana==='くる')f.conditional=s==='来る'?'来れば':'くれば';}
 if(['いらっしゃる','おっしゃる','くださる','なさる','ござる'].includes(kana)){const b=s.slice(0,-1)+'い';Object.assign(f,{polite:b+'ます',politePast:b+'ました',politeNegative:b+'ません',politeNegativePast:b+'ませんでした'});}
 if(f.causative)f.causativePassive=f.causative.slice(0,-1)+'られる';
 for(const name of ['potential','passive','causative','causativePassive']){const v=f[name];if(v?.endsWith('る')){const b=v.slice(0,-1);Object.assign(f,{[name+'Polite']:b+'ます',[name+'PolitePast']:b+'ました',[name+'Negative']:b+'ない',[name+'PoliteNegative']:b+'ません',[name+'Past']:b+'た',[name+'Te']:b+'て'});}}
 if(e.notes.includes('い-adj.')&&s.endsWith('い')){const b=kana==='いい'?'よ':s.slice(0,-1);Object.assign(f,{adverb:b+'く',conditional:b+'ければ',negative:b+'くない',past:b+'かった',negativePast:b+'くなかった',te:b+'くて'});}
 for(const [i,surface] of e.forms.split('|').entries()){const c=clean(surface);if(c&&permitted(c)&&!/[〜～~／/]/.test(c)&&surface===c)f['approved'+i]=c;}
 return f;
}
export function approvedKanji(entries:Entry[]){return new Set(entries.filter(e=>e.kind==='kanji'&&[...e.term].length===1).flatMap(e=>[...e.term]));}
export const functionTokens:Record<string,string> = Object.fromEntries([
'すぎる','すぎます','すぎました','お','ご','ください','まえに','なきゃいけません','いる','います','いた','いました','ある','あります','あった','ありました','する','します','した','しました','できる','できません','みる','おく','しまう','くれる','もらう','あげる','ほしい','いい','は','が','を','に','で','へ','と','も','の','や','から','まで','より','ね','よ','か','だけ','しか','でも','では','には','とは','です','でした','ではありません','じゃないです','じゃなかったです','だ','だった','じゃない','じゃなかった','な','なかった','ない','なく','なくて','て','た','ます','ました','ません','ませんでした','ましょう','ましょうか','なければいけません','なくてもいい','ないでください','てください','てもいいです','てはいけません','ています','ていました','ている','ていた','でいる','でいます','んです','のです','ので','のに','なら','たら','ば','し','そうです','みたいです','たい','たくない','たかった','たり','ながら','こと','ことがある','ことがない','つもりです','と思います','と思っています','と言っていました','はずです','かもしれません','でしょうか','ほうがいい','ほうが','いちばん','やすい','にくい','ように','ような','のように','のような','なさい','方','かどうか','って','てから','てみる','てみます','ておく','てしまう','てある','てほしい','てくれる','てもらう','てあげる','ていただけませんか','てくれてありがとう','てよかった','といい','ばよかった','てすみませんでした','ことにする','ことにしている','ことになっている','ことになっています','のに対して','わけだ','わけです','ようとする','ようとした','ようとしています','とする','とした','としました','としています','は言うまでもなく','によって','にとって','という','あいだに','。','、','？','「','」'
].map((s,i)=>['g'+i,s]));
export function renderTokens(tokens:{id:string;form:string}[],words:Word[],functions:Record<string,string>){
 if(!Array.isArray(tokens)||tokens.length<2||tokens.length>80)throw Error('The sentence did not pass the course check. Please retry.');
 const used=new Set<string>();const text=tokens.map(t=>{if(t.id==='grammar'){if(!Object.hasOwn(functions,t.form))throw Error('A sentence contained an unapproved grammar form. Please retry.');return functions[t.form];}const w=words.find(w=>w.id===t.id);if(!w||!Object.hasOwn(w.forms,t.form))throw Error('A sentence contained a word or form outside your course. Please retry.');used.add(w.id);return w.forms[t.form];}).join('');
 if(!used.size||text.length>350)throw Error('No usable course sentence was returned. Please retry.');return {text,used:[...used]};
}
export function matchSentence(text:string,registry:Record<string,string>):string[]{
 if(typeof text!=='string'||text.length>350)throw Error('Invalid sentence length.');
 const surfaces=Object.entries(registry).filter(([,s])=>s).sort((a,b)=>b[1].length-a[1].length);
 const paths:(string[]|undefined)[]=new Array(text.length+1);paths[0]=[];
 for(let i=0;i<text.length;i++){if(!paths[i])continue;for(const [id,s] of surfaces){if(text.startsWith(s,i)&&!paths[i+s.length])paths[i+s.length]=[...paths[i]!,id];}}
 const result=paths[text.length];if(!result)throw Error('The sentence included a word or form outside the supplied vocabulary. Use only the provided surface spellings, including kana.');return result;
}
