'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {Command,CommandInput,CommandList,CommandGroup,CommandItem,CommandEmpty} from '@/components/ui/command';
import {Search,Shuffle,ChevronRight} from 'lucide-react';
import {grammarGroup,groupLabel} from '@/lib/practice-scope';
import type {Entry} from '@/lib/course';
export default function GrammarPicker({entries,group,target,onChange,disabled}:{entries:Entry[];group:string;target:string;onChange:(group:string,target:string)=>void;disabled:boolean}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[browse,setBrowse]=useState(group);
 const grammar=entries.filter(e=>e.kind==='grammar');const groups=[...new Set(grammar.map(grammarGroup))];
 const book=browse.startsWith('genki-')?(Number(browse.slice(6))<=12?'one':'two'):'hiyaku';
 const inBook=groups.filter(g=>book==='hiyaku'?!g.startsWith('genki-'):g.startsWith('genki-')&&(book==='one'?Number(g.slice(6))<=12:Number(g.slice(6))>=13)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const normalized=query.normalize('NFKC').trim().toLowerCase();
 const shown=normalized?grammar.filter(g=>normalized.split(/\s+/).every(part=>[g.term,g.definition,groupLabel(grammarGroup(g))].join(' ').normalize('NFKC').toLowerCase().includes(part))):grammar.filter(g=>grammarGroup(g)===browse);
 const shownGroups=[...new Set(shown.map(grammarGroup))];
 const choose=(g:string,id:string)=>{onChange(g,id);setOpen(false);};
 return <Dialog open={open} onOpenChange={v=>{if(v){setBrowse(group);setQuery('');}setOpen(v);}}><DialogTrigger render={<Button variant="outline" disabled={disabled} className="w-full h-auto justify-between p-4 text-left whitespace-normal"/>}><span><span className="block text-sm opacity-65">{groupLabel(group)}</span><span className="block mt-1 text-base">{target==='mixed'?`Mix all ${grammar.filter(g=>grammarGroup(g)===group).length} grammar points`:grammar.find(g=>g.id===target)?.term}</span></span><Search className="size-5 shrink-0 ml-3"/></DialogTrigger>
 <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-hidden p-5 gap-4"><DialogHeader><DialogTitle>Choose your grammar</DialogTitle><DialogDescription>Browse a chapter, or search every pattern by Japanese or meaning.</DialogDescription></DialogHeader>
 <Command shouldFilter={false} className="min-h-0"><CommandInput aria-label="Search grammar across all chapters" placeholder="Search: わけ, permission, Genki 22…" value={query} onValueChange={setQuery}/>
 {!normalized&&<div className="mt-3"><Tabs value={book} onValueChange={v=>{setBrowse(v==='one'?'genki-1':v==='two'?'genki-13':'hiyaku-1');}}><TabsList className="w-full"><TabsTrigger value="hiyaku">Hiyaku</TabsTrigger><TabsTrigger value="one">Genki I</TabsTrigger><TabsTrigger value="two">Genki II</TabsTrigger></TabsList></Tabs><div className="flex flex-wrap gap-2 mt-3 mb-3" aria-label="Grammar chapters">{inBook.map(g=><Button key={g} size="sm" variant={browse===g?'default':'outline'} aria-pressed={browse===g} onClick={()=>setBrowse(g)}>{g.startsWith('genki-')?'Ch. '+Number(g.slice(6)):g==='hiyaku-1'?'Chapter 1':'Other class grammar'}</Button>)}</div></div>}
 <CommandList className="max-h-[42vh] mt-2"><CommandEmpty>No matching grammar. Try a Japanese pattern or an English meaning.</CommandEmpty>
 {shownGroups.map(g=><CommandGroup key={g} heading={groupLabel(g)}><CommandItem value={'mix-'+g} onSelect={()=>choose(g,'mixed')} className="py-3" data-checked={group===g&&target==='mixed'}><Shuffle className="size-4"/><span>Mix this chapter <small className="block opacity-65">All {grammar.filter(e=>grammarGroup(e)===g).length} grammar points</small></span></CommandItem>{shown.filter(e=>grammarGroup(e)===g).map(e=><CommandItem key={e.id} value={e.id} onSelect={()=>choose(g,e.id)} data-checked={group===g&&target===e.id} className="py-3"><span><span className="block text-base" lang="ja">{e.term}</span><span className="block text-sm opacity-65 mt-1">{e.definition}</span></span><ChevronRight className="ml-auto size-4 shrink-0"/></CommandItem>)}</CommandGroup>)}
 </CommandList></Command></DialogContent></Dialog>;
}
