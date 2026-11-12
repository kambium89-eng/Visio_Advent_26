const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const defaultOrigins = ["https://kambium89-eng.github.io", "http://localhost:8765", "http://127.0.0.1:8765"];
function base64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");}
function decode64(value){return Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));}
async function key(secret){return crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);}
async function signedToken(secret,now){
  const payload=base64url(encoder.encode(JSON.stringify({sub:"advent-team",exp:Math.floor(now.getTime()/1000)+SESSION_SECONDS,nonce:crypto.randomUUID()})));
  const signature=base64url(new Uint8Array(await crypto.subtle.sign("HMAC",await key(secret),encoder.encode(payload))));
  return `${payload}.${signature}`;
}
async function authorized(request,secret,now){
  const token=request.headers.get("Authorization")?.replace(/^Bearer /,"")||"";
  if(token.length>1000)return false;
  const [payload,signature,extra]=token.split(".");if(!payload||!signature||extra)return false;
  try{
    if(!await crypto.subtle.verify("HMAC",await key(secret),decode64(signature),encoder.encode(payload)))return false;
    const claims=JSON.parse(new TextDecoder().decode(decode64(payload)));
    return claims.sub==="advent-team"&&Number.isInteger(claims.exp)&&claims.exp>Math.floor(now.getTime()/1000);
  }catch{return false;}
}
async function equalSecret(a,b){
  const [first,second]=await Promise.all([a,b].map(v=>crypto.subtle.digest("SHA-256",encoder.encode(v))));
  const x=new Uint8Array(first),y=new Uint8Array(second);let difference=0;
  for(let i=0;i<x.length;i++)difference|=x[i]^y[i];return difference===0;
}
async function readJson(request){
  if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))throw{status:415,error:"Bitte sende die Formulardaten als JSON."};
  const reader=request.body?.getReader();if(!reader)throw{status:400,error:"Die Formulardaten fehlen."};
  const chunks=[];let size=0;
  while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>12288){await reader.cancel();throw{status:413,error:"Die Eingabe ist zu lang."};}chunks.push(value);}
  const merged=new Uint8Array(size);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(merged));}catch{throw{status:400,error:"Die Formulardaten sind ungültig."};}
}
// The clock controls session expiry and login limiting, not which day link may open.
export async function handleApi(request,env,now=new Date()){
  const origin=request.headers.get("Origin");
  const origins=env.ALLOWED_ORIGINS?env.ALLOWED_ORIGINS.split(",").map(s=>s.trim()):defaultOrigins;
  const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Vary":"Origin"};
  if(origin&&origins.includes(origin))headers["Access-Control-Allow-Origin"]=origin;
  const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
  if(origin&&!origins.includes(origin))return json({error:"Dieser Zugriff ist nicht erlaubt."},403);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Max-Age":"600"}});
  const path=new URL(request.url).pathname.replace(/\/$/,"");
  if(path==="/api/health"&&request.method==="GET")return json({ok:true});
  if(!env.TEAM_PASSWORD||!env.SESSION_SECRET||!env.DB)return json({error:"Der Teamzugang ist noch nicht bereit. Bitte versuche es später nochmals."},503);
  try{
    if(path==="/api/login"&&request.method==="POST"){
      const data=await readJson(request);
      if(typeof data.username!=="string"||typeof data.password!=="string"||data.username.length>80||data.password.length>200)return json({error:"Bitte prüfe Teamname und Passwort."},400);
      const window=Math.floor(now.getTime()/(15*60*1000));
      const ip=request.headers.get("CF-Connecting-IP")||"unknown";
      const digest=await crypto.subtle.sign("HMAC",await key(env.SESSION_SECRET),encoder.encode(`${window}:${ip}`));
      const limiterId=base64url(new Uint8Array(digest));
      const previous=await env.DB.prepare("SELECT attempts FROM login_attempts WHERE id = ?").bind(limiterId).first();
      if(previous&&previous.attempts>=30)return json({error:"Zu viele Anmeldeversuche. Bitte versuche es in 15 Minuten nochmals."},429,{"Retry-After":"900"});
      const correct=await equalSecret(data.password,env.TEAM_PASSWORD);
      if(data.username!=="Wichtel"||!correct){
        await env.DB.batch([
          env.DB.prepare("DELETE FROM login_attempts WHERE window < ?").bind(window-1),
          env.DB.prepare("INSERT INTO login_attempts (id, window, attempts) VALUES (?, ?, 1) ON CONFLICT(id) DO UPDATE SET attempts = attempts + 1").bind(limiterId,window)
        ]);
        return json({error:"Teamname oder Passwort stimmt nicht. Bitte versuche es nochmals."},401);
      }
      return json({token:await signedToken(env.SESSION_SECRET,now),expiresIn:SESSION_SECONDS});
    }
    if(path!=="/api/responses")return json({error:"Diese Seite gibt es nicht."},404);
    if(!await authorized(request,env.SESSION_SECRET,now))return json({error:"Bitte melde dich mit dem Teamzugang an."},401);
    if(request.method==="DELETE"){
      const data=await readJson(request);
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId||""))return json({error:"Die Einsendungs-ID fehlt. Bitte verwende den ursprünglichen Browser-Tab."},400);
      // The unguessable receipt exists only in its originating browser session.
      await env.DB.prepare("DELETE FROM pride_responses WHERE id = ?").bind(data.submissionId).run();
      return json({deleted:true});
    }
    if(request.method==="GET"){
      const rows=await env.DB.prepare("SELECT answers_json FROM pride_responses ORDER BY RANDOM() LIMIT 1000").all();
      const answers=rows.results.flatMap(row=>JSON.parse(row.answers_json));
      for(let i=answers.length-1;i>0;i--){const random=crypto.getRandomValues(new Uint32Array(1))[0];const j=random%(i+1);[answers[i],answers[j]]=[answers[j],answers[i]];}
      return json({answers});
    }
    if(request.method==="POST"){
      const data=await readJson(request);
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.submissionId||""))return json({error:"Bitte lade die Seite neu und versuche es nochmals."},400);
      if(!Array.isArray(data.answers)||data.answers.length<1||data.answers.length>5||data.answers.some(a=>typeof a!=="string"||a.trim().length>500))return json({error:"Ein Gedanke reicht. Du kannst bis zu fünf Dinge aufschreiben, mit höchstens 500 Zeichen pro Feld."},400);
      const answers=data.answers.map(a=>a.trim()).filter(Boolean);
      if(!answers.length)return json({error:"Ein Gedanke reicht. Wenn du magst, schreib etwas in eines der Felder."},400);
      await env.DB.prepare("INSERT INTO pride_responses (id, answers_json, saved_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET answers_json = excluded.answers_json, saved_at = excluded.saved_at").bind(data.submissionId,JSON.stringify(answers),now.toISOString()).run();
      return json({saved:true},201);
    }
    return json({error:"Dieser Zugriff ist nicht erlaubt."},405,{Allow:"GET, POST, DELETE, OPTIONS"});
  }catch(error){
    if(error?.status&&error?.error)return json({error:error.error},error.status);
    return json({error:"Das Speichern oder Laden ist gerade nicht möglich. Bitte versuche es nochmals."},503);
  }
}
