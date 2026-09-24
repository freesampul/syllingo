import type {Entry} from './course';
import {genkiChapter,grammarGroup} from './practice-scope';

export const complexityOptions = [
 {id:'focused',label:'Focused',summary:'One pattern, one clear idea.',detail:'A short sentence to get comfortable with your grammar focus.',min:1,max:1},
 {id:'connected',label:'Connected',summary:'Two patterns working together.',detail:'Add a reason, time clause, description, or reported thought.',min:2,max:2},
 {id:'worksheet',label:'Worksheet',summary:'Two–three patterns, fuller context.',detail:'Layer familiar grammar in one longer sentence or two linked sentences, like class translation work.',min:2,max:3},
] as const;
export type Complexity=typeof complexityOptions[number]['id'];
export function parseComplexity(value:unknown):Complexity {
 if(value===undefined)return 'focused';
 if(!complexityOptions.some(c=>c.id===value))throw Error('Choose Focused, Connected, or Worksheet complexity.');
 return value as Complexity;
}
export const complexityLabel=(value:unknown)=>complexityOptions.find(c=>c.id===value)?.label||'Focused';
export function supportingGrammar(all:Entry[],group:string){
 const chapter=group.startsWith('genki-')?Number(group.slice(6)):23;
 return all.filter(e=>{const introduced=genkiChapter(e);return e.kind==='grammar'&&(grammarGroup(e)===group||(introduced!==null&&introduced<=chapter));});
}
export function complexityBrief(level:Complexity){
 const option=complexityOptions.find(c=>c.id===level)!;
 return {...option,instructions:level==='focused'
 ? 'Keep one meaningful target pattern and one clear idea in one short sentence. Except when explicitly the primary target, ordinary particles, basic X-is-Y/X-has-Y descriptions, tense, politeness and basic conjugations do not count as additional focus patterns.'
 : level==='connected'
 ? 'Use the primary target plus exactly one compatible supporting pattern from allowedGrammar. Connect them naturally in one sentence; for example, a reason with reported speech, or a time clause with a request. Except when explicitly the primary target, ordinary particles, basic X-is-Y/X-has-Y descriptions, tense, politeness and basic conjugations do not count toward the two patterns.'
 : 'Match college worksheet translation complexity: use the primary target plus one or two compatible supporting patterns from allowedGrammar. Require layered meaning: include an embedded clause (reported thought/question, noun-modifying clause, or nominalized action), or combine a time/condition/reason clause with a second substantive relationship. A simple statement plus only a reason is Connected level and must not pass as Worksheet. Include at least two substantive actions or facts and a relationship between them. Merely appending I think to a short statement is not enough. One longer sentence or two closely linked sentences are enough. Examples of structure (not required vocabulary): a reported decision explained by a recent change; a childhood wish involving someone doing a favor before an event; a decision depending on an embedded question. Layer meaning, not merely length. Avoid disconnected simple sentences, filler, obscure words, and forcing incompatible patterns. Except when explicitly the primary target, ordinary particles, basic X-is-Y/X-has-Y descriptions, tense, politeness and basic conjugations do not count toward the 2–3 patterns.'};
}
export function auditedGrammar(ids:unknown,allowed:Entry[],targetId:string,level:Complexity){
 if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'))throw Error('The grammar review was incomplete.');
 const unique=[...new Set(ids)];const option=complexityOptions.find(c=>c.id===level)!;
 if(!unique.includes(targetId)||unique.length<option.min||unique.length>option.max||unique.some(id=>!allowed.some(g=>g.id===id)))throw Error('The sentence did not meet the selected grammar complexity.');
 return [targetId,...unique.filter(id=>id!==targetId)].map(id=>allowed.find(g=>g.id===id)!);
}
