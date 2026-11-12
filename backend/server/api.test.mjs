import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { handleApi } from './api.mjs';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_harsh_carlie_cooper.sql',import.meta.url),'utf8'));
  const wrap=(sql,args=[])=>({
    bind:(...values)=>wrap(sql,values),
    first:async()=>sqlite.prepare(sql).get(...args)||null,
    all:async()=>({results:sqlite.prepare(sql).all(...args)}),
    run:async()=>sqlite.prepare(sql).run(...args),
  });
  const env={TEAM_PASSWORD:randomBytes(18).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex'),DB:{prepare:sql=>wrap(sql),batch:async statements=>Promise.all(statements.map(s=>s.run()))}};
  const request=(path,method='GET',data,token,now='2026-12-01T12:00:00Z',extraHeaders={})=>handleApi(new Request(`https://api.example/api${path}`,{method,headers:{Origin:'https://kambium89-eng.github.io','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...extraHeaders},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,new Date(now));
  const login=async(now)=>{const response=await request('/login','POST',{username:'Wichtel',password:env.TEAM_PASSWORD},undefined,now);assert.equal(response.status,200);return(await response.json()).token;};
  return{sqlite,env,request,login};
}
test('login, authorization, CORS and cache controls',async()=>{
  const f=fixture();
  assert.equal((await f.request('/responses')).status,401);
  assert.equal((await f.request('/login','POST',{username:'Wichtel',password:'wrong'})).status,401);
  const token=await f.login();
  const result=await f.request('/responses','GET',undefined,token);
  assert.equal(result.status,200);assert.deepEqual((await result.json()).answers,[]);
  assert.equal(result.headers.get('Cache-Control'),'no-store, private');
  assert.equal((await f.request('/responses','GET',undefined,token,undefined,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await f.request('/responses','GET',undefined,token+'bad')).status,401);
  assert.equal((await f.request('/responses','GET',undefined,token,'2026-12-01T21:00:01Z')).status,401);
});
test('one to five bounded answers; safe upsert without identities',async()=>{
  const f=fixture(),token=await f.login(),id=randomUUID();
  const answers=['  A small step  ','Second','<script>alert(1)</script>','Fourth','Fifth'];
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:[]},token)).status,400);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:[' ','','','','']},token)).status,400);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:[...answers,'Sixth']},token)).status,400);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:['a'.repeat(501),...answers.slice(1)]},token)).status,400);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers,name:'ignored',email:'ignored'},token)).status,201);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:['Changed',...answers.slice(1)]},token)).status,201);
  const rows=f.sqlite.prepare('SELECT * FROM pride_responses').all();
  assert.equal(rows.length,1);assert.deepEqual(Object.keys(rows[0]).sort(),['answers_json','id','saved_at']);
  assert.equal(JSON.parse(rows[0].answers_json)[0],'Changed');
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:['One thing is enough']},token)).status,201);
  assert.deepEqual(JSON.parse(f.sqlite.prepare('SELECT answers_json FROM pride_responses WHERE id = ?').get(id).answers_json),['One thing is enough']);
  assert.equal((await f.request('/responses','POST',{submissionId:id,answers:[' ','','  One thought in the third field  ','','']},token)).status,201);
  assert.deepEqual(JSON.parse(f.sqlite.prepare('SELECT answers_json FROM pride_responses WHERE id = ?').get(id).answers_json),['One thought in the third field']);
});
test('ordinary authenticated day links work in November, on December 23 and after Christmas',async()=>{
  const f=fixture(),answers=['A','B','C','D','E'];
  for(const now of ['2026-11-12T12:00:00Z','2026-12-23T12:00:00Z','2027-01-05T12:00:00Z']){
    const token=await f.login(now),id=randomUUID();
    assert.equal((await f.request('/responses','POST',{submissionId:id,answers},token,now)).status,201);
    const response=await f.request('/responses','GET',undefined,token,now);
    assert.equal(response.status,200);
    const data=await response.json();
    assert.deepEqual(Object.keys(data),['answers']);
    assert.equal(data.answers.length,5);
    assert.deepEqual(data.answers.sort(),answers);
    assert.equal((await f.request('/responses','GET',undefined,undefined,now)).status,401);
    await f.request('/responses','DELETE',{submissionId:id},token,now);
  }
});
test('failed logins are rate-limited, without retaining raw network addresses',async()=>{
  const f=fixture();
  for(let i=0;i<30;i++)assert.equal((await f.request('/login','POST',{username:'Wichtel',password:'wrong'},undefined,undefined,{'CF-Connecting-IP':'192.0.2.44'})).status,401);
  assert.equal((await f.request('/login','POST',{username:'Wichtel',password:'wrong'},undefined,undefined,{'CF-Connecting-IP':'192.0.2.44'})).status,429);
  assert.equal(JSON.stringify(f.sqlite.prepare('SELECT * FROM login_attempts').all()).includes('192.0.2.44'),false);
});
test('an authenticated browser can withdraw only the submission for its random receipt',async()=>{
  const f=fixture(),token=await f.login(),id=randomUUID(),answers=['A','B','C','D','E'];
  await f.request('/responses','POST',{submissionId:id,answers},token);
  assert.equal((await f.request('/responses','DELETE',{submissionId:id})).status,401);
  assert.equal((await f.request('/responses','DELETE',{submissionId:randomUUID()},token)).status,200);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,1);
  assert.equal((await f.request('/responses','DELETE',{submissionId:id},token)).status,200);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,0);
});
test('invalid JSON, excessive bodies and unavailable service fail clearly',async()=>{
  const f=fixture();
  const invalid=new Request('https://api.example/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});
  assert.equal((await handleApi(invalid,f.env)).status,400);
  assert.equal((await f.request('/login','POST',{username:'Wichtel',password:'x'.repeat(13000)})).status,413);
  assert.equal((await handleApi(new Request('https://api.example/api/responses'),{})).status,503);
});
