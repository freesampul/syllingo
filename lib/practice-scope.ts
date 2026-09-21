import type {Entry} from './course';
export type PracticeScope={genkiThrough:number;includeHiyaku:boolean};
export const defaultScope:PracticeScope={genkiThrough:23,includeHiyaku:true};
export function parseScope(value:unknown):PracticeScope {
 if(value===undefined)return defaultScope;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid vocabulary coverage.');
 const v=value as Record<string,unknown>;
 if(!Number.isInteger(v.genkiThrough)||Number(v.genkiThrough)<1||Number(v.genkiThrough)>23||typeof v.includeHiyaku!=='boolean')throw Error('Choose a Genki chapter from 1 to 23.');
 return {genkiThrough:Number(v.genkiThrough),includeHiyaku:v.includeHiyaku};
}
export function genkiChapter(e:Entry):number|null {const m=/^Genki\s+(\d+)$/.exec(e.lesson);return m?Number(m[1]):null;}
export function isGenki(e:Entry){return e.id.startsWith('genki-')||e.lesson.startsWith('Genki ');}
export function vocabularyInScope(all:Entry[],scope:PracticeScope){return all.filter(e=>{
 if(e.kind!=='vocabulary'&&!(e.kind==='kanji'&&[...e.term].length>1))return false;
 if(!isGenki(e))return scope.includeHiyaku;
 const chapter=genkiChapter(e);return chapter!==null?chapter<=scope.genkiThrough:e.lesson==='Genki expressions';
});}
export function grammarGroup(e:Entry){const ch=genkiChapter(e);return ch!==null?'genki-'+ch:e.id.startsWith('hiyaku-grammar-')?'hiyaku-1':'class';}
export function groupLabel(id:string){return id==='hiyaku-1'?'Hiyaku · Chapter 1':id==='class'?'Other class grammar':'Genki '+(Number(id.slice(6))<=12?'I':'II')+' · Chapter '+Number(id.slice(6));}
export function grammarTargets(all:Entry[],group:string,target:string){
 const available=all.filter(e=>e.kind==='grammar'&&grammarGroup(e)===group);
 if(!available.length)throw Error('Choose an available grammar chapter.');
 const chosen=target==='mixed'?available:available.filter(e=>e.id===target);
 if(!chosen.length)throw Error('That grammar point is not in the selected chapter.');return chosen;
}
