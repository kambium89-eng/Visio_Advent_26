const SESSION_SECONDS = 8 * 60 * 60;
const ADMIN_SESSION_SECONDS = 15 * 60;
const ADMIN_PAGE_SIZE = 25;
const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();
const defaultOrigins = ["https://kambium89-eng.github.io", "http://localhost:8765", "http://127.0.0.1:8765"];
function base64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");}
function decode64(value){return Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));}
async function key(secret){return crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);}
async function signedToken(secret,now,subject="advent-team",lifetime=SESSION_SECONDS){
  const payload=base64url(encoder.encode(JSON.stringify({sub:subject,exp:Math.floor(now.getTime()/1000)+lifetime,nonce:crypto.randomUUID()})));
  const signature=base64url(new Uint8Array(await crypto.subtle.sign("HMAC",await key(secret),encoder.encode(payload))));
  return `${payload}.${signature}`;
}
async function authorized(request,secret,now,subject="advent-team"){
  const token=request.headers.get("Authorization")?.replace(/^Bearer /,"")||"";
  if(token.length>1000)return false;
  const [payload,signature,extra]=token.split(".");if(!payload||!signature||extra)return false;
  try{
    if(!await crypto.subtle.verify("HMAC",await key(secret),decode64(signature),encoder.encode(payload)))return false;
    const claims=JSON.parse(new TextDecoder().decode(decode64(payload)));
    return claims.sub===subject&&Number.isInteger(claims.exp)&&claims.exp>Math.floor(now.getTime()/1000);
  }catch{return false;}
}
async function adminSubmission(row) {
  const snapshot = JSON.stringify([row.id, row.saved_at, row.answers_json]);
  const revision = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(snapshot))));
  return { id: row.id, savedAt: row.saved_at, answers: JSON.parse(row.answers_json), revision };
}

async function handleAdmin(request, env, url, path, now, json) {
  const unauthorized = () => json({ error: "Bitte melde dich über den Editor auf deinem Mac an." }, 401);
  if (request.headers.has("Origin")) return json({ error: "Dieser Zugriff ist nicht erlaubt." }, 403);
  if (!env.DB || !env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_DEVICE_KEY || !env.ADMIN_SESSION_SECRET) {
    return json({ error: "Der Adminzugang ist noch nicht bereit." }, 503);
  }
  const deviceKey = request.headers.get("X-Advent-Device-Key") || "";
  if (!/^[a-f0-9]{64}$/.test(deviceKey) || !await equalSecret(deviceKey, env.ADMIN_DEVICE_KEY)) return unauthorized();

  if (path === "/api/admin/login" && request.method === "POST") {
    const { username, password } = await readJson(request);
    if (typeof username !== "string" || typeof password !== "string" || username.length > 80 || password.length > 200) {
      return json({ error: "Bitte prüfe Benutzername und Passwort." }, 400);
    }
    const window = Math.floor(now.getTime() / (ADMIN_SESSION_SECONDS * 1000));
    const limiterId = `admin:${window}`;
    const attempt = await env.DB.prepare(`
      INSERT INTO login_attempts (id, window, attempts) VALUES (?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET attempts = attempts + 1 WHERE attempts < 8
      RETURNING attempts
    `).bind(limiterId, window).first();
    if (!attempt) return json({ error: "Zu viele Anmeldeversuche. Bitte versuche es später nochmals." }, 429);
    const [validUsername, validPassword] = await Promise.all([
      equalSecret(username, env.ADMIN_USERNAME), equalSecret(password, env.ADMIN_PASSWORD)
    ]);
    if (!validUsername || !validPassword) return unauthorized();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM login_attempts WHERE id = ?").bind(limiterId),
      env.DB.prepare("DELETE FROM login_attempts WHERE window < ? AND id LIKE 'admin:%'").bind(window - 1)
    ]);
    const token = await signedToken(env.ADMIN_SESSION_SECRET, now, "advent-admin", ADMIN_SESSION_SECONDS);
    return json({ token, expiresIn: ADMIN_SESSION_SECONDS });
  }

  if (!await authorized(request, env.ADMIN_SESSION_SECRET, now, "advent-admin")) return unauthorized();
  if (path === "/api/admin/submissions" && request.method === "GET") {
    const before = url.searchParams.get("before");
    const beforeId = url.searchParams.get("beforeId");
    if ((before !== null || beforeId !== null) &&
        (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(before || "") || !submissionIdPattern.test(beforeId || ""))) {
      return json({ error: "Diese Seite konnte nicht geladen werden." }, 400);
    }
    const columns = "SELECT id, answers_json, saved_at FROM pride_responses";
    const order = " ORDER BY saved_at DESC, id DESC LIMIT ?";
    const query = before
      ? env.DB.prepare(`${columns} WHERE (saved_at, id) < (?, ?)${order}`).bind(before, beforeId, ADMIN_PAGE_SIZE + 1)
      : env.DB.prepare(columns + order).bind(ADMIN_PAGE_SIZE + 1);
    const { results } = await query.all();
    const submissions = await Promise.all(results.slice(0, ADMIN_PAGE_SIZE).map(adminSubmission));
    const last = submissions.at(-1);
    const next = results.length > ADMIN_PAGE_SIZE ? { before: last.savedAt, beforeId: last.id } : null;
    return json({ submissions, next });
  }

  const id = path.replace(/^\/api\/admin\/submissions\//, "");
  if (!submissionIdPattern.test(id) || !["PUT", "DELETE"].includes(request.method)) {
    return json({ error: "Diese Seite gibt es nicht." }, 404);
  }
  const { answers, revision } = await readJson(request);
  if (typeof revision !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(revision)) {
    return json({ error: "Bitte lade die Einsendung erneut." }, 400);
  }
  if (request.method === "PUT" && (!Array.isArray(answers) || answers.length < 1 || answers.length > 5 ||
      answers.some(answer => typeof answer !== "string" || !answer.trim() || answer.trim().length > 500))) {
    return json({ error: "Bitte behalte ein bis fünf Gedanken mit je höchstens 500 Zeichen." }, 400);
  }
  const row = await env.DB.prepare("SELECT id, answers_json, saved_at FROM pride_responses WHERE id = ?").bind(id).first();
  const conflict = () => json({ error: "Die Einsendung wurde inzwischen geändert oder gelöscht. Bitte lade die Seite neu." }, 409);
  if (!row || revision !== (await adminSubmission(row)).revision) return conflict();

  const unchanged = "WHERE id = ? AND saved_at = ? AND answers_json = ?";
  if (request.method === "DELETE") {
    const deleted = await env.DB.prepare(`DELETE FROM pride_responses ${unchanged} RETURNING id`)
      .bind(id, row.saved_at, row.answers_json).first();
    return deleted ? json({ deleted: true }) : conflict();
  }
  const updated = await env.DB.prepare(`UPDATE pride_responses SET answers_json = ? ${unchanged} RETURNING id, saved_at, answers_json`)
    .bind(JSON.stringify(answers.map(answer => answer.trim())), id, row.saved_at, row.answers_json).first();
  return updated ? json({ submission: await adminSubmission(updated) }) : conflict();
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
  try{
    const data=JSON.parse(new TextDecoder().decode(merged));
    if(data===null||typeof data!=="object"||Array.isArray(data))throw new Error("Expected an object");
    return data;
  }catch{throw{status:400,error:"Die Formulardaten sind ungültig."};}
}
// Swiss midnight: December 2026 is CET (UTC+01:00), independent of server time zone.
const SUBMISSIONS_OPEN = Date.parse("2026-12-01T00:00:00+01:00");
const COLLECTION_OPENS = Date.parse("2026-12-23T00:00:00+01:00");
export async function handleApi(request,env,now=new Date()){
  const origin=request.headers.get("Origin");
  const origins=env.ALLOWED_ORIGINS?env.ALLOWED_ORIGINS.split(",").map(s=>s.trim()):defaultOrigins;
  const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Vary":"Origin"};
  const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (path === "/api/admin" || path.startsWith("/api/admin/")) {
    try {
      return await handleAdmin(request, env, url, path, now, json);
    } catch (error) {
      return error?.status && error?.error ? json({ error: error.error }, error.status)
        : json({ error: "Das Speichern oder Laden ist gerade nicht möglich. Bitte versuche es nochmals." }, 503);
    }
  }
  if(origin&&origins.includes(origin))headers["Access-Control-Allow-Origin"]=origin;
  if(origin&&!origins.includes(origin))return json({error:"Dieser Zugriff ist nicht erlaubt."},403);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Max-Age":"600"}});
  if(path==="/api/health"&&request.method==="GET")return json({ok:true});
  if(!env.TEAM_USERNAME||!env.TEAM_PASSWORD||!env.SESSION_SECRET||!env.DB)return json({error:"Der Teamzugang ist noch nicht bereit. Bitte versuche es später nochmals."},503);
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
      const [correctUsername,correctPassword]=await Promise.all([equalSecret(data.username,env.TEAM_USERNAME),equalSecret(data.password,env.TEAM_PASSWORD)]);
      if(!correctUsername||!correctPassword){
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
    if(request.method==="GET"&&now.getTime()<COLLECTION_OPENS)return json({locked:true,error:"Dieses Häuschen öffnet sich am 23. Dezember."},403);
    if(["POST","DELETE"].includes(request.method)&&now.getTime()<SUBMISSIONS_OPEN)return json({locked:true,error:"Dieses Häuschen öffnet sich am 1. Dezember."},403);
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
