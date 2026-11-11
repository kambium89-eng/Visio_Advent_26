"use strict";

// Vorschau für die erste Version. Vor dem Advent auf null setzen.
const PREVIEW_DATE = "2026-12-09";
const API_BASE = "https://visio-advent-2026-api.inventivetoast1.chatgpt.site";
const READY_DAYS = [1, 5, 6, 7, 9, 23];
const DAYS = {
    1: {title:"Fünf Dinge, auf die du stolz bist",kind:"Ein Moment für dich",intro:"Grosse Schritte, kleine Erfolge – heute darfst du sie feiern.",type:"form"},
    5: {title:"Die zwei Wölfe",kind:"Eine kleine Geschichte",intro:"Eine Parabel über das, dem wir unsere Aufmerksamkeit schenken.",type:"story"},
    6: {title:"Samichlaus mit Otto",kind:"Zeit zum Schmunzeln",intro:"Ein bisschen Schalk zum Samichlaus. Mach es dir gemütlich.",type:"video"},
    7: {title:"Ein Spaziergang voller Farben",kind:"Mit offenen Augen",intro:"Manchmal liegt das Schöne direkt vor unseren Füssen.",type:"hunt"},
    9: {title:"Weihnachten mit Calvin und Hobbes",kind:"Eine kleine Portion Humor",intro:"Ein Weihnachtswunsch kommt selten allein.",type:"image"},
    23: {title:"Darauf sind wir stolz",kind:"Unser gemeinsamer Rückblick",intro:"Viele kleine und grosse Dinge. Und jede Menge Gründe, stolz zu sein.",type:"reveal"}
};
const EXAMPLE_PROUD_MOMENTS = [
    "Ich habe etwas Neues ausprobiert, obwohl ich zuerst unsicher war.",
    "Ich habe jemandem aufmerksam zugehört.",
    "Ich habe eine Pause gemacht, als ich sie gebraucht habe.",
    "Ich habe eine schwierige Aufgabe Schritt für Schritt geschafft.",
    "Ich habe um Hilfe gebeten und nicht aufgegeben.",
    "Ich habe einer anderen Person Mut gemacht.",
    "Ich habe einen Fehler zugegeben und daraus gelernt.",
    "Ich habe mir Zeit für etwas genommen, das mir Freude macht.",
    "Ich habe heute einen kleinen Anfang gewagt.",
    "Ich habe ein ehrliches Kompliment ausgesprochen.",
    "Ich habe eine Idee mit anderen geteilt.",
    "Ich habe eine Aufgabe fertig gemacht, die lange liegen geblieben war.",
    "Ich bin geduldig mit mir geblieben.",
    "Ich habe mich getraut, eine Frage zu stellen.",
    "Ich habe etwas repariert, statt es wegzuwerfen.",
    "Ich habe mich für jemanden mitgefreut.",
    "Ich habe meine Meinung freundlich vertreten.",
    "Ich habe jemanden zum Lachen gebracht.",
    "Ich habe einen kleinen Fortschritt wahrgenommen.",
    "Ich habe etwas Schönes mit anderen geteilt.",
    "Ich habe mich an etwas Schwieriges herangewagt.",
    "Ich habe jemandem Danke gesagt.",
    "Ich habe mir erlaubt, auf meinen eigenen Weg stolz zu sein.",
    "Ich habe eine Grenze gesetzt und gut auf mich geachtet.",
    "Ich habe mich nach einem Rückschlag wieder aufgerappelt.",
    "Ich habe eine neue Kollegin oder einen neuen Kollegen willkommen geheissen.",
    "Ich habe eine kleine Gewohnheit verändert, die mir guttut.",
    "Ich habe eine Entscheidung getroffen, die ich lange aufgeschoben habe.",
    "Ich habe mir selbst ein freundliches Wort geschenkt.",
    "Ich habe mich entschuldigt und den ersten Schritt gemacht.",
    "Ich habe meine Hilfe angeboten, ohne etwas dafür zu erwarten.",
    "Ich habe bemerkt, wie viel ich schon gelernt habe."
];
const $ = id => document.getElementById(id);
const memoryClouds = typeof MemoryClouds === "function" ? new MemoryClouds() : null;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const content = $("day-content"), body = $("content-body");
const params = new URLSearchParams(location.search);
const previewDay = Number(params.get("vorschau"));
const explicitPreview = Number.isInteger(previewDay) && previewDay >= 1 && previewDay <= 24;
function zurichDate() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}
const actualDate=zurichDate();
const automaticPreview=Boolean(PREVIEW_DATE&&actualDate<"2026-12-01");
const isPreview=explicitPreview||automaticPreview;
const calendarDate = explicitPreview ? `2026-12-${String(previewDay).padStart(2,"0")}` : automaticPreview ? PREVIEW_DATE : actualDate;
const releasedDay = calendarDate < "2026-12-01" ? 0 : calendarDate > "2026-12-24" ? 24 : Number(calendarDate.slice(-2));
const defaultDay = READY_DAYS.filter(day=>day<=releasedDay).at(-1) || 1;
let selectedDay = defaultDay, generation = 0, arrivalAnimation = null, finishArrival = null;
let token = readSession("advent-team-token") || "";
let storyPromise;
function readSession(key) {try{return sessionStorage.getItem(key);}catch{return null;}}
function writeSession(key,value) {try{if(value===null)sessionStorage.removeItem(key);else sessionStorage.setItem(key,value);}catch{}}
function getDayFromUrl() {const day=Number(new URLSearchParams(location.search).get("tag"));return Number.isInteger(day)&&day>=1&&day<=24?day:defaultDay;}
const HOUSE_POSITIONS = [
    [50,12,145],[40,19,133],[60,15,140],[30,11,132],[70,19,143],[20,14,132],
    [80,10,142],[10,20,129],[90,13,131],[5,83,96],[95,83,98],[15,98,105],
    [25,105,105],[35,92,104],[45,108,103],[55,98,104],[65,107,102],[75,92,105],
    [85,106,102],[21,57,103],[42,54,106],[63,55,105],[83,57,103],[50,145,101]
];

function makeVillage() {
    document.body.classList.toggle('full-village',releasedDay>9);
    const memoryDay=Boolean(memoryClouds&&token&&selectedDay===23&&releasedDay>=23);
    memoryClouds?.beginPage(memoryDay);
    const nav=$("village-houses");nav.replaceChildren();
    for(let day=1;day<=releasedDay;day++) {
        const ready=READY_DAYS.includes(day),house=document.createElement(memoryDay?"button":ready?"a":"span");
        const [left,bottom,width]=HOUSE_POSITIONS[day-1];
        house.className=`village-house${memoryDay?" memory-house":ready?"":" unprepared"}`;
        house.dataset.day=day;
        house.style.cssText=`--left:${left}%;--bottom:${bottom}px;--width:${width}px;--layer:${bottom<40?5:bottom<80?4:3}`;
        house.setAttribute("aria-label",memoryDay?`${day}. Häuschen – Stolzmoment anzeigen`:`${day}. Dezember${ready?`: ${day===23?"Eine kleine Überraschung":DAYS[day].title}`:" – wird noch vorbereitet"}`);
        const openHouse=event=>{if(event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();if(day!==selectedDay)selectDay(day,true);}};
        const url=new URL(location.href);url.searchParams.set("tag",day);
        if(memoryDay)house.type="button";
        else if(ready) {
            house.href=url.href;
            house.addEventListener("click",openHouse);
        }
        const image=document.createElement("img");image.src=`assets/web/houses/house-${String(day).padStart(2,"0")}.webp`;image.alt="";image.width=150;image.height=150;image.draggable=false;
        const number=document.createElement(memoryDay?"button":ready?"a":"span");number.className=`house-number village-marker${memoryDay||ready?"":" unprepared"}`;number.textContent=`${day}.`;number.setAttribute("aria-hidden","true");
        number.dataset.day=day;number.style.cssText=`--left:${left}%;--bottom:${bottom}px`;
        if(memoryDay){number.type="button";number.tabIndex=-1;memoryClouds.bind(house,number,day);}
        else if(ready){number.href=house.href;number.tabIndex=-1;number.addEventListener("click",openHouse);}
        if(day===selectedDay){house.setAttribute("aria-current","page");number.setAttribute("aria-current","page");}
        house.append(image);nav.append(house,number);
    }
    $("village-count").textContent=`${releasedDay} von 24 Häuschen`;
    const hint=document.querySelector(".village-hint");
    hint.hidden=selectedDay===23;
    hint.textContent=selectedDay===23?"":"Jeden Tag ein neues Häuschen. Klicke auf ein Häuschen und schau noch einmal vorbei.";
}

async function arrive(day,viewId) {
    const target=document.querySelector(`.village-house[data-day="${day}"]`);
    if(!target||reducedMotion.matches){document.body.classList.remove("is-arriving");return;}
    const overlay=$("arrival"),image=$("arrival-house"),targetImage=target.querySelector("img");
    overlay.hidden=false;overlay.removeAttribute("aria-hidden");
    image.src=targetImage.src;$("arrival-day").textContent=`${day}. Dezember`;
    target.classList.add("arrival-target");
    const wash=overlay.querySelector(".arrival-wash"),copy=overlay.querySelector(".arrival-copy");
    wash.style.opacity="";copy.style.opacity="";$("arrival-skip").hidden=false;
    try{await image.decode();}catch{}
    if(viewId!==generation)return;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    let finished=false;
    finishArrival=()=>{
        if(finished)return;finished=true;
        arrivalAnimation?.cancel();arrivalAnimation=null;overlay.getAnimations({subtree:true}).forEach(a=>a.cancel());
        target.classList.remove("arrival-target");overlay.hidden=true;overlay.setAttribute("aria-hidden","true");
        if(viewId===generation){document.body.classList.remove("is-arriving");$("page-status").textContent=`${day}. Dezember: ${$("day-title").textContent}`;}
        finishArrival=null;
    };
    $("arrival-skip").onclick=()=>{finishArrival?.();content.focus({preventScroll:true});};
    const from=image.getBoundingClientRect(),to=targetImage.getBoundingClientRect();
    const dx=to.left+to.width/2-(from.left+from.width/2),dy=to.top+to.height/2-(from.top+from.height/2),scale=to.width/from.width;
    const start="translate(-50%, -50%)";
    arrivalAnimation=image.animate([
        {transform:start,offset:0},
        {transform:`${start} scale(1.025)`,offset:.29},
        {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`,offset:1}
    ],{duration:2300,easing:"cubic-bezier(.35,0,.18,1)",fill:"forwards"});
    wash.animate([{opacity:1},{opacity:1,offset:.28},{opacity:0}],{duration:2200,fill:"forwards"});
    copy.animate([{opacity:1},{opacity:1,offset:.25},{opacity:0,offset:.58},{opacity:0}],{duration:2200,fill:"forwards"});
    await arrivalAnimation.finished.catch(()=>{});
    if(!finished&&viewId===generation)finishArrival?.();
}

function setHeading(day,future) {
    const info=DAYS[day];
    const surpriseLogin=day===23&&!token&&!future;
    $("day-eyebrow").textContent=`${day}. Dezember${info&&!surpriseLogin&&!future?` · ${info.kind}`:""}`;
    $("day-title").textContent=surpriseLogin?"Eine kleine Überraschung wartet auf dich nach dem Login":future?"Noch ein bisschen Vorfreude":info?.title||"Hier entsteht eine Überraschung";
    $("day-intro").textContent=future?`Dieses Häuschen öffnet sich am ${day}. Dezember.`:info?.intro||"An diesem Tag wartet bald ein kleiner Adventsmoment auf dich.";
    $("day-intro").hidden=surpriseLogin;
    const guidance=$("day-guidance");
    if(guidance){guidance.hidden=day!==1||future;guidance.textContent=day===1?"Versuche dir Fünf Dinge zu überlegen auf die du stolz bist. Falls dir nur etwas in den Sinn kommt, ist das nicht so schlimm.":"";}
    document.title=`${day}. Dezember · ${surpriseLogin||future?"Eine kleine Überraschung":info?.title||"Adventskalender 2026"}`;
    $("page-status").textContent=`${day}. Dezember: ${$("day-title").textContent}`;
}

async function selectDay(day,updateUrl=false) {
    finishArrival?.();generation++;const viewId=generation;selectedDay=day;
    document.querySelectorAll('.arrival-target').forEach(h=>h.classList.remove('arrival-target'));
    $("arrival").hidden=true;
    if(updateUrl){const url=new URL(location.href);url.searchParams.set("tag",day);history.pushState(null,"",url);}
    makeVillage();
    window.scrollTo({top:0,behavior:"instant"});
    body.replaceChildren();content.style.maxWidth="";content.scrollTop=0;
    document.querySelectorAll(".village-house,.village-marker").forEach(h=>{if(Number(h.dataset.day)===day)h.setAttribute("aria-current","page");else h.removeAttribute("aria-current");});
    const future=day>releasedDay;setHeading(day,future);
    content.dataset.type=DAYS[day]?.type||'pending';
    if(future||!DAYS[day]){document.body.classList.remove("is-arriving");body.innerHTML='<p class="empty-state">Jeden Tag kommt ein neuer kleiner Moment dazu.</p>';return;}
    document.body.classList.add("is-arriving");
    switch(DAYS[day].type){
        case "story":await renderStory(viewId);break;
        case "video":body.innerHTML='<iframe class="video-frame" id="christmas-video" title="Otto &amp; der Weihnachtsmann" allow="encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p class="media-link"><a href="https://www.youtube.com/watch?v=NpBb5qFIaIY" target="_blank" rel="noopener noreferrer">Video auf YouTube öffnen ↗</a></p>';break;
        case "image":body.innerHTML='<img class="comic" src="Images/Calvin&amp;Hobbs_Xmas.jpg" width="900" height="632" alt="Weihnachtscomic mit Calvin und Hobbes: Calvin träumt von einem Brief des Weihnachtsmanns mit umgekehrten Weihnachtsregeln."><p class="media-link"><a href="Images/Calvin&amp;Hobbs_Xmas.jpg" target="_blank" rel="noopener">Bild in voller Grösse öffnen ↗</a></p>';break;
        case "hunt":renderHunt();break;
        case "form":case "reveal":renderProtected(day,viewId);break;
    }
    if(viewId!==generation)return;
    await arrive(day,viewId);
    if(viewId===generation&&day===6){const video=$("christmas-video");if(video)video.src="https://www.youtube-nocookie.com/embed/NpBb5qFIaIY?hl=de&playsinline=1";}
}

async function renderStory(viewId) {
    body.innerHTML='<p class="form-message" role="status">Die Geschichte wird geladen …</p>';
    if(!storyPromise)storyPromise=Promise.all(["content/05-dezember.md","content/05-dezember-erklaerung.md"].map(async path=>{const response=await fetch(path);if(!response.ok)throw new Error("story");return marked.parse((await response.text()).replace(/^##[^\n]*\n/,""));})).catch(error=>{storyPromise=null;throw error;});
    try{
        const [story,explanation]=await storyPromise;if(viewId!==generation)return;
        body.innerHTML='<div class="reading" id="story-reading"></div><div class="story-actions"><button class="primary-button" id="explanation-toggle" type="button" aria-controls="story-reading"><span class="turn-symbol" aria-hidden="true">↻</span><span>Erklärung anzeigen</span></button></div>';
        const reading=$("story-reading"),toggle=$("explanation-toggle");let showingExplanation=false;
        reading.innerHTML=story;
        toggle.addEventListener("click",async()=>{
            toggle.disabled=true;reading.setAttribute("aria-busy","true");
            if(!reducedMotion.matches)await reading.animate([{transform:"rotateY(0deg)",opacity:1},{transform:"rotateY(-90deg)",opacity:0}],{duration:260,easing:"ease-in",fill:"forwards"}).finished.catch(()=>{});
            if(viewId!==generation)return;
            showingExplanation=!showingExplanation;reading.innerHTML=showingExplanation?explanation:story;
            content.scrollTop=0;
            toggle.lastElementChild.textContent=showingExplanation?"Geschichte anzeigen":"Erklärung anzeigen";
            reading.getAnimations().forEach(a=>a.cancel());
            if(!reducedMotion.matches)await reading.animate([{transform:"rotateY(90deg)",opacity:0},{transform:"rotateY(0deg)",opacity:1}],{duration:300,easing:"ease-out"}).finished.catch(()=>{});
            reading.removeAttribute("aria-busy");toggle.disabled=false;
        });
    }catch{if(viewId===generation)body.innerHTML='<p class="form-message error" role="alert">Die Geschichte konnte nicht geladen werden. Bitte lade die Seite erneut.</p>';}
}

function renderHunt(){
    body.innerHTML='<p class="color-intro">Nimm dir einen kleinen Moment draussen. Du brauchst kein Ziel. Schau dich einfach um: Welche Farben findest du?</p><div class="hunt-steps"><section><span class="hunt-step-number">1.</span><h3>Komm kurz an.</h3><p>Bleib einen Augenblick stehen. Spüre den Boden unter deinen Füssen und nimm deine Umgebung wahr.</p></section><section><span class="hunt-step-number">2.</span><h3>Entdecke fünf Farben.</h3><p>Ein Blatt, ein Fenster, ein Schal. Halte nach den fünf Farben Ausschau – ähnliche Farbtöne zählen auch.</p></section><section><span class="hunt-step-number">3.</span><h3>Nimm einen Moment mit.</h3><p>Welches kleine Detail hat dich überrascht? Schenke ihm noch einen Augenblick Aufmerksamkeit.</p></section></div><fieldset class="color-list"><legend class="sr-only">Welche Farben hast du entdeckt?</legend></fieldset><p class="hunt-progress" role="status"></p><button class="text-button hunt-reset" type="button">Auswahl zurücksetzen</button>';
    const colors=[["Tannengrün","#52775c"],["Winterweiss","#f8f5e8"],["Goldgelb","#d4ae58"],["Beerenrot","#a65e59"],["Himmelblau","#9bbcc5"]];
    const list=body.querySelector(".color-list"),progress=body.querySelector(".hunt-progress");
    for(const [name,color]of colors){const label=document.createElement("label");label.className="color-choice";label.innerHTML=`<input type="checkbox"><span class="color-dot" style="--swatch:${color}" aria-hidden="true"></span><span>${name}</span>`;list.append(label);}
    const update=()=>{const count=list.querySelectorAll(":checked").length;progress.textContent=count===5?"Fünf Farben, fünf kleine Entdeckungen. Schön, dass du dir Zeit genommen hast.":`${count} von 5 Farben entdeckt. Deine Auswahl bleibt auf dieser Seite.`;};
    list.addEventListener("change",update);body.querySelector(".hunt-reset").addEventListener("click",()=>{list.querySelectorAll("input").forEach(i=>i.checked=false);update();});update();
}

async function api(path,options={}) {
    let response;
    try{response=await fetch(`${API_BASE}/api${path}`,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers},credentials:"omit",cache:"no-store"});}
    catch{throw new Error("Die Verbindung konnte nicht hergestellt werden. Bitte versuche es nochmals.");}
    let data;try{data=await response.json();}catch{throw new Error("Der Teamzugang ist gerade nicht erreichbar. Bitte versuche es später nochmals.");}
    if(!response.ok){const error=new Error(data.error||"Das hat leider nicht geklappt. Bitte versuche es nochmals.");error.status=response.status;error.data=data;throw error;}
    return data;
}
function forgetLogin(){token="";writeSession("advent-team-token",null);memoryClouds?.clear();}
function renderProtected(day,viewId) {
    if(!token){renderLogin(day,viewId);return;}
    if(day===23){makeVillage();setHeading(day,day>releasedDay);}
    body.innerHTML='<div class="team-session"><button class="text-button" id="team-logout" type="button">Abmelden</button></div><div id="protected-content"></div>';
    $("team-logout").onclick=()=>{forgetLogin();writeSession("advent-pride-saved",null);writeSession("advent-pride-id",null);renderProtected(day,viewId);};
    if(day===1)renderPrideForm(viewId);else renderReveal(viewId);
}
function renderLogin(day,viewId,message="") {
    if(day===23){makeVillage();setHeading(day,day>releasedDay);}
    body.innerHTML='<form class="login-panel" id="team-login"><p class="form-intro">Dieser Adventsmoment gehört unserem Team.</p><label class="field-label" for="team-name">Teamname</label><input id="team-name" name="username" autocomplete="username" required value="Wichtel" maxlength="80"><label class="field-label" for="team-password">Passwort</label><input id="team-password" name="password" type="password" autocomplete="current-password" required maxlength="200"><button class="primary-button" type="submit">Mit dem Teamzugang anmelden <span aria-hidden="true">→</span></button><p class="form-message" id="login-message" role="status"></p><p class="login-help">Verwende den gemeinsamen Teamzugang aus unserem Advents-E-Mail.</p></form>';
    $("login-message").textContent=message;
    $("team-login").addEventListener("submit",async event=>{
        event.preventDefault();const button=event.currentTarget.querySelector("button"),status=$("login-message");button.disabled=true;status.textContent="Du wirst angemeldet …";status.classList.remove("error");
        try{const data=await api("/login",{method:"POST",body:JSON.stringify({username:$("team-name").value.trim(),password:$("team-password").value})});if(viewId!==generation)return;token=data.token;writeSession("advent-team-token",token);$("team-password").value="";renderProtected(day,viewId);}
        catch(error){if(viewId!==generation)return;status.textContent=error.message;status.classList.add("error");button.disabled=false;}
    });
}
function handleProtectedError(error,day,viewId,status){
    if(viewId!==generation)return;
    if(error.status===401){forgetLogin();renderLogin(day,viewId,"Deine Anmeldung ist abgelaufen. Bitte melde dich nochmals an.");}
    else{status.textContent=error.message;status.classList.add("error");}
}
function renderPrideForm(viewId){
    const target=$("protected-content");
    if(readSession("advent-pride-saved")){renderSaved();return;}
    showFields();
    function showFields(){
        target.innerHTML='<p class="form-intro">Was macht dich stolz?</p><form id="pride-form"><fieldset class="pride-fields"><legend class="sr-only">Deine Gedanken, bis zu fünf Dinge</legend></fieldset><p class="notice">Teile bitte nur, was du mit allen teilen möchtest und bleib freundlich und respektvoll. Die Antworten könnten vielleicht später zu einer Überraschung führen</p><div class="form-footer"><button class="primary-button" type="submit">Antworten speichern <span aria-hidden="true">→</span></button><p class="form-message" id="pride-message" role="status"></p></div></form>';
        const fields=target.querySelector(".pride-fields");
        for(let i=1;i<=5;i++){const field=document.createElement("div");field.className="pride-field";field.innerHTML=`<label class="field-label" for="pride-${i}"><span>${i}.</span>Darauf bin ich stolz</label><textarea id="pride-${i}" name="answer-${i}" rows="2" maxlength="500" placeholder="Eine kleine oder grosse Sache …"></textarea>`;fields.append(field);}
        $("pride-form").addEventListener("submit",async event=>{
            event.preventDefault();const answers=Array.from(fields.querySelectorAll("textarea"),t=>t.value.trim()).filter(Boolean);
            const status=$("pride-message");status.classList.remove("error");if(!answers.length){status.textContent="Ein Gedanke reicht. Wenn du magst, schreib etwas in eines der Felder.";return;}
            let submissionId=readSession("advent-pride-id");if(!submissionId){submissionId=crypto.randomUUID();writeSession("advent-pride-id",submissionId);}
            const button=event.currentTarget.querySelector("button");button.disabled=true;status.textContent="Deine Antworten werden gespeichert …";
            try{await api("/responses",{method:"POST",body:JSON.stringify({answers,submissionId})});if(viewId!==generation)return;writeSession("advent-pride-saved","1");renderSaved();}
            catch(error){handleProtectedError(error,1,viewId,status);button.disabled=false;}
        });
    }
    function renderSaved(){
        target.innerHTML='<div class="success-panel"><div class="success-symbol" aria-hidden="true">✧</div><h3>Das darfst du feiern.</h3><p>Danke, dein Beitrag ist gespeichert. Schön, dass du dir diesen Moment genommen hast.</p><button class="text-button" id="replace-answers" type="button">Meine Antworten ersetzen</button><span aria-hidden="true"> · </span><button class="text-button" id="withdraw-answers" type="button">Antworten zurückziehen</button><div id="withdraw-confirmation"></div></div>';
        $("replace-answers").onclick=()=>{writeSession("advent-pride-saved",null);showFields();};
        $("withdraw-answers").onclick=()=>{
            const confirmation=$("withdraw-confirmation");confirmation.innerHTML='<p class="form-message">Möchtest du deinen Beitrag wirklich aus der Sammlung löschen?</p><button class="text-button" id="confirm-withdraw" type="button">Ja, meine Antworten löschen</button><span aria-hidden="true"> · </span><button class="text-button" id="cancel-withdraw" type="button">Behalten</button><p class="form-message" id="withdraw-message" role="status"></p>';
            $("cancel-withdraw").onclick=()=>confirmation.replaceChildren();
            $("confirm-withdraw").onclick=async()=>{
                const button=$("confirm-withdraw");button.disabled=true;
                try{await api("/responses",{method:"DELETE",body:JSON.stringify({submissionId:readSession("advent-pride-id")})});if(viewId!==generation)return;writeSession("advent-pride-saved",null);writeSession("advent-pride-id",null);showFields();$("pride-message").textContent="Deine Antworten wurden aus der Sammlung gelöscht.";}
                catch(error){handleProtectedError(error,1,viewId,$("withdraw-message"));button.disabled=false;}
            };
        };
    }
}
async function renderReveal(viewId){
    const target=$("protected-content");target.innerHTML='<p class="form-message" role="status">Unser Rückblick wird geladen …</p>';
    try{const data=await api("/responses");if(viewId!==generation)return;showMemoryVillage(target,data.answers,false);}
    catch(error){
        if(viewId!==generation)return;
        if(error.status===403&&error.data?.locked){
            target.innerHTML='<div class="release-lock"><div class="release-date" aria-hidden="true">23. Dezember</div><h3>Vorfreude ist auch ein schönes Gefühl.</h3><p>Unsere gesammelten Antworten bleiben bis zum 23. Dezember geschützt. Dann kannst du hier entdecken, worauf unser Team stolz ist.</p></div>';
            if(isPreview){const button=document.createElement("button");button.className="text-button";button.type="button";button.textContent="Vorschau mit Beispielantworten ansehen";target.querySelector(".release-lock").append(button);button.onclick=()=>showMemoryVillage(target,EXAMPLE_PROUD_MOMENTS,true);}
        }else{target.replaceChildren();const status=document.createElement("p");status.className="form-message";status.setAttribute("role","status");target.append(status);handleProtectedError(error,23,viewId,status);}
    }
}
function showMemoryVillage(target,answers,example){
    target.replaceChildren();
    if(example){const label=document.createElement("p");label.className="example-label";label.textContent="Beispielansicht – diese Texte sind erfunden und keine gespeicherten Teambeiträge.";target.append(label);}
    memoryClouds?.setCollection(answers,example);
    if(!answers.length){const empty=document.createElement("p");empty.className="empty-state";empty.textContent="In unserer Sammlung sind noch keine Beiträge. Auch kleine Schritte sind ein Grund, stolz auf sich zu sein.";target.append(empty);return;}
    const instructions=document.createElement("div");instructions.className="memory-instructions";
    const text=document.createElement("p");text.textContent=memoryClouds?"Lass deine Maus über die Häuschen schweben und schau, was passiert.":"Lade die Seite einmal neu, um die Überraschung in unserem Dorf zu entdecken.";
    instructions.append(text);
    if(memoryClouds){const help=document.createElement("p");help.textContent="Bleib bei einem Häuschen: Es steigen immer neue Stolzmomente auf. Über einer Wolke kannst du sie in Ruhe lesen.";instructions.append(help);const keyboard=document.createElement("p");keyboard.className="sr-only";keyboard.textContent="Mit der Tabtaste wählst du ein Häuschen. Enter zeigt den nächsten Gedanken. Escape schliesst die Wolken.";instructions.append(keyboard);}
    target.append(instructions);
    content.scrollTop=0;
}

if(isPreview){$("preview-label").hidden=false;$("preview-label").textContent=`Vorschau · ${releasedDay}. Dezember`;}
if(!reducedMotion.matches)for(let i=0;i<25;i++){const flake=document.createElement("i");flake.className="snowflake";const size=2+(i%4);flake.style.cssText=`left:${(i*37.7)%100}%;width:${size}px;height:${size}px;--duration:${13+i%11}s;--delay:-${i*.93}s;--opacity:${.25+(i%4)*.1}`;$("snowfall").append(flake);}
window.addEventListener("popstate",()=>selectDay(getDayFromUrl()));
document.addEventListener("visibilitychange",()=>{if(document.hidden)finishArrival?.();});
selectDay(getDayFromUrl());
