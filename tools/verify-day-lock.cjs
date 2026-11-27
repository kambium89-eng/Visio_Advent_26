"use strict";
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {test}=require("node:test");
const vm=require("node:vm");
const source=readFileSync(`${__dirname}/../script.js`,"utf8").replace(/\nstartCalendar\(\);\s*$/,"\n");
const calendar=JSON.parse(readFileSync(`${__dirname}/../content/calendar.json`,"utf8"));

function harness(instant,query="?tag=1"){
    let clock=Date.parse(instant),serial=0;
    const timers=new Map(),elements=new Map(),windowEvents=new Map(),documentEvents=new Map(),renders=[];
    class Element{
        constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.attributes={};this.events=new Map();this.hidden=false;this.classList={add(){},remove(){},toggle(){}};}
        append(...children){this.children.push(...children);}
        replaceChildren(...children){this.children=children;}
        setAttribute(key,value){this.attributes[key]=value;}
        removeAttribute(key){delete this.attributes[key];}
        addEventListener(key,fn){this.events.set(key,fn);}
        scrollTo(){}
    }
    class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
    const location=new URL(`https://example.test/Visio_Advent_26/${query}`);
    const document={body:new Element(),hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement:()=>new Element(),querySelectorAll:()=>[],addEventListener:(key,fn)=>documentEvents.set(key,fn)};
    const context=vm.createContext({Date:ClockDate,Intl,URL,URLSearchParams,document,location,matchMedia:()=>({matches:true}),sessionStorage:{getItem:()=>null,removeItem(){},setItem(){}},window:{addEventListener:(key,fn)=>windowEvents.set(key,fn),scrollTo(){}},history:{pushState(_a,_b,url){location.href=url.href;},replaceState(){}},setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),fixtures:calendar,renders});
    vm.runInContext(source,context);
    // Use a text renderer spy to isolate release gating from each day's activity.
    vm.runInContext('DAYS=Object.fromEntries(fixtures.map(day=>[day.day,{...day,type:"text"}]));renderText=async day=>{renders.push(day);body.append("approved content");};arrive=async()=>{};',context);
    return{
        context,elements,renders,document,windowEvents,documentEvents,timers,
        select:day=>context.selectDay(day),
        async advance(ms,runTimers=true){clock+=ms;if(runTimers){for(const [id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);await timer.fn();}}await new Promise(setImmediate);},
        get count(){return elements.get("village-houses").children.length;},
        get locked(){return elements.get("day-content").dataset.type==="locked";}
    };
}

test("all 24 links lock immediately before Swiss midnight and open at midnight in other time zones",async()=>{
    const originalTZ=process.env.TZ;
    try{
        for(const zone of ["Europe/Zurich","America/Los_Angeles","Asia/Tokyo"]){
            process.env.TZ=zone;
            for(let day=1;day<=24;day++){
                const release=Date.parse(`2026-12-${String(day).padStart(2,"0")}T00:00:00+01:00`);
                const h=harness(new Date(release-1).toISOString());
                await h.select(day);
                assert.equal(h.locked,true,`${zone}, day ${day} before midnight`);
                assert.equal(h.elements.get("day-title").textContent,"Noch ein bisschen Vorfreude");
                assert.equal(h.elements.get("day-title").hidden,false);
                assert.equal(h.elements.get("day-intro").textContent,`Dieses Häuschen öffnet sich am ${day}. Dezember.`);
                assert.equal(h.elements.get("day-guidance").hidden,true);
                assert.equal(h.count,day-1);assert.deepEqual(h.renders,[]);
                await h.advance(1);
                assert.equal(h.locked,false,`${zone}, day ${day} at midnight`);
                assert.deepEqual(h.renders,[day]);assert.equal(h.count,day);
                assert.equal(h.elements.get("day-title").textContent,day===23?"Eine kleine Überraschung wartet auf dich nach dem Login":calendar[day-1].title);
                assert.equal(h.elements.get("day-title").hidden,day===7);
                if(day>1){await h.select(day-1);assert.equal(h.locked,false);}
            }
        }
    }finally{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;}
});

test("all links stay open after Christmas and throughout following years",async()=>{
    for(const date of ["2026-12-25T00:00:00Z","2027-01-01T00:00:00Z","2027-11-01T00:00:00Z","2028-12-01T00:00:00Z"]){
        const h=harness(date);
        for(let day=1;day<=24;day++){await h.select(day);assert.equal(h.locked,false);assert.equal(h.count,day);}
        assert.equal(h.timers.size,0);
    }
});

test("direct links, history navigation and old preview parameters cannot reveal a future day",async()=>{
    const h=harness("2026-11-27T12:00:00Z","?tag=24&vorschau=24&preview=1&date=2026-12-24");
    await h.windowEvents.get("popstate")();
    assert.equal(h.locked,true);assert.equal(h.count,0);assert.deepEqual(h.renders,[]);
    assert.equal(h.context.getDayFromUrl(),24);
    for(const day of [1,7,23,24]){await h.select(day);assert.equal(h.locked,true);}
});

test("returning to a suspended tab or restoring a cached page rechecks the release",async()=>{
    for(const event of ["visibilitychange","pageshow","focus"]){
        const h=harness("2026-12-01T22:59:59.999Z");await h.select(2);
        await h.advance(1,false);
        const listener=event==="visibilitychange"?h.documentEvents.get(event):h.windowEvents.get(event);
        await listener();await new Promise(setImmediate);
        assert.equal(h.locked,false);assert.deepEqual(h.renders,[2]);
    }
});

test("midnight preserves an already-open activity and updates the houses on a future link",async()=>{
    const h=harness("2026-12-01T22:59:59.999Z");await h.select(1);
    h.elements.get("content-body").append("unsaved draft");
    await h.advance(1);
    assert.deepEqual(h.renders,[1]);assert.equal(h.elements.get("content-body").children.at(-1),"unsaved draft");
    const future=harness("2026-12-01T22:59:59.999Z");await future.select(24);
    assert.equal(future.count,1);await future.advance(1);
    assert.equal(future.count,2);assert.equal(future.locked,true);assert.deepEqual(future.renders,[]);
});
