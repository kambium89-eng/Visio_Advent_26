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
  const env={TEAM_USERNAME:'TEST_ONLY_TEAM',TEAM_PASSWORD:randomBytes(18).toString('hex'),SESSION_SECRET:randomBytes(32).toString('hex'),DB:{prepare:sql=>wrap(sql),batch:async statements=>Promise.all(statements.map(s=>s.run()))}};
  const request=(path,method='GET',data,token,now='2026-12-23T12:00:00Z',extraHeaders={})=>handleApi(new Request(`https://api.example/api${path}`,{method,headers:{Origin:'https://kambium89-eng.github.io','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...extraHeaders},...(data===undefined?{}:{body:JSON.stringify(data)})}),env,new Date(now));
  const login=async(now)=>{const response=await request('/login','POST',{username:env.TEAM_USERNAME,password:env.TEAM_PASSWORD},undefined,now);assert.equal(response.status,200);return(await response.json()).token;};
  return{sqlite,env,request,login};
}
test('login, authorization, CORS and cache controls',async()=>{
  const f=fixture();
  assert.equal((await f.request('/responses')).status,401);
  assert.equal((await f.request('/login','POST',{username:f.env.TEAM_USERNAME,password:'wrong'})).status,401);
  const token=await f.login();
  const result=await f.request('/responses','GET',undefined,token);
  assert.equal(result.status,200);assert.deepEqual((await result.json()).answers,[]);
  assert.equal(result.headers.get('Cache-Control'),'no-store, private');
  assert.equal((await f.request('/responses','GET',undefined,token,undefined,{Origin:'https://untrusted.example'})).status,403);
  assert.equal((await f.request('/responses','GET',undefined,token+'bad')).status,401);
  assert.equal((await f.request('/responses','GET',undefined,token,'2026-12-23T21:00:01Z')).status,401);
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
test('Swiss midnight locks submissions until December 1 and the collection until December 23',async()=>{
  const f=fixture(),id=randomUUID(),answers=['One real thought'];
  for(const now of ['2026-11-12T12:00:00Z','2026-11-30T22:59:59.999Z']){
    const token=await f.login(now);
    for(const method of ['GET','POST','DELETE']){
      const response=await f.request('/responses',method,method==='GET'?undefined:{submissionId:id,answers},token,now);
      assert.equal(response.status,403);assert.equal((await response.json()).locked,true);
    }
    assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,0);
  }
  for(const now of ['2026-11-30T23:00:00.000Z','2026-12-22T22:59:59.999Z']){
    const token=await f.login(now);
    assert.equal((await f.request('/responses','POST',{submissionId:id,answers},token,now)).status,201);
    const locked=await f.request('/responses','GET',undefined,token,now);
    assert.equal(locked.status,403);assert.equal((await locked.json()).locked,true);
    assert.equal((await f.request('/responses','GET',undefined,undefined,now)).status,401);
    assert.equal((await f.request('/responses','DELETE',{submissionId:id},token,now)).status,200);
  }
  for(const now of ['2026-12-22T23:00:00.000Z','2026-12-25T12:00:00Z','2027-01-05T12:00:00Z','2027-11-01T00:00:00Z']){
    const token=await f.login(now);
    assert.equal((await f.request('/responses','POST',{submissionId:id,answers},token,now)).status,201);
    const response=await f.request('/responses','GET',undefined,token,now);
    assert.equal(response.status,200);assert.deepEqual((await response.json()).answers,answers);
    assert.equal((await f.request('/responses','DELETE',{submissionId:id},token,now)).status,200);
  }
});
test('failed logins are rate-limited, without retaining raw network addresses',async()=>{
  const f=fixture();
  for(let i=0;i<30;i++)assert.equal((await f.request('/login','POST',{username:f.env.TEAM_USERNAME,password:'wrong'},undefined,undefined,{'CF-Connecting-IP':'192.0.2.44'})).status,401);
  assert.equal((await f.request('/login','POST',{username:f.env.TEAM_USERNAME,password:'wrong'},undefined,undefined,{'CF-Connecting-IP':'192.0.2.44'})).status,429);
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
  assert.equal((await f.request('/login','POST',{username:f.env.TEAM_USERNAME,password:'x'.repeat(13000)})).status,413);
  assert.equal((await handleApi(new Request('https://api.example/api/responses'),{})).status,503);
});

test('team username is required server configuration and checked with the password',async()=>{
  const f=fixture();
  const credentials={username:f.env.TEAM_USERNAME,password:f.env.TEAM_PASSWORD};
  assert.equal((await f.request('/login','POST',{...credentials,username:'WRONG_TEST_ONLY_TEAM'})).status,401);
  const token=await f.login();
  for(const missing of [undefined,'']){
    f.env.TEAM_USERNAME=missing;
    const login=await f.request('/login','POST',credentials);
    assert.equal(login.status,503);
    assert.equal('token' in await login.json(),false);
    assert.equal((await f.request('/responses','GET',undefined,token)).status,503);
  }
});
test('JSON bodies must be objects for login, saving and withdrawal',async()=>{
  const f=fixture(),token=await f.login();
  for(const body of [null,[],['test'],true,42,'test']){
    assert.equal((await f.request('/login','POST',body)).status,400);
    assert.equal((await f.request('/responses','POST',body,token)).status,400);
    assert.equal((await f.request('/responses','DELETE',body,token)).status,400);
  }
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,0);
});
test('anonymous submissions cannot write moments',async()=>{
  const f=fixture();
  const response=await f.request('/responses','POST',{submissionId:randomUUID(),answers:['Test moment']});
  assert.equal(response.status,401);
  assert.equal('saved' in await response.json(),false);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,0);
});
test('a failed database write never confirms a saved moment',async()=>{
  const f=fixture(),token=await f.login();
  const prepare=f.env.DB.prepare;
  f.env.DB.prepare=sql=>sql.startsWith('INSERT INTO pride_responses')
    ?{bind:()=>({run:async()=>{throw new Error('Simulated storage outage');}})}
    :prepare(sql);
  const response=await f.request('/responses','POST',{submissionId:randomUUID(),answers:['Test moment']},token);
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal('saved' in body,false);
  assert.equal(typeof body.error,'string');
  assert.equal(f.sqlite.prepare('SELECT count(*) AS total FROM pride_responses').get().total,0);
});
test('retry after a lost confirmation keeps one submission for the same receipt',async()=>{
  const f=fixture(),token=await f.login(),submissionId=randomUUID(),answers=['Test moment'];
  // The write completes, but the client loses its confirmation and keeps its receipt.
  await f.request('/responses','POST',{submissionId,answers},token);
  const retry=await f.request('/responses','POST',{submissionId,answers},token);
  assert.equal(retry.status,201);
  assert.deepEqual(await retry.json(),{saved:true});
  const rows=f.sqlite.prepare('SELECT id, answers_json FROM pride_responses').all();
  assert.equal(rows.length,1);
  assert.equal(rows[0].id,submissionId);
  assert.deepEqual(JSON.parse(rows[0].answers_json),answers);
});

function adminFixture() {
  const f = fixture();
  Object.assign(f.env, {
    ADMIN_USERNAME: 'TEST_ONLY_ADMIN',
    ADMIN_PASSWORD: randomBytes(18).toString('hex'),
    ADMIN_DEVICE_KEY: randomBytes(32).toString('hex'),
    ADMIN_SESSION_SECRET: randomBytes(32).toString('hex'),
  });
  const credentials = { username: f.env.ADMIN_USERNAME, password: f.env.ADMIN_PASSWORD };
  const request = (path, method = 'GET', data, token, now = '2026-12-01T12:00:00Z', headers = {}) => handleApi(new Request(`https://api.example/api/admin${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Advent-Device-Key': f.env.ADMIN_DEVICE_KEY,
      ...(token && { Authorization: `Bearer ${token}` }), ...headers },
    ...(data && { body: JSON.stringify(data) }),
  }), f.env, new Date(now));
  const signIn = async () => {
    const response = await request('/login', 'POST', credentials);
    assert.equal(response.status, 200);
    return (await response.json()).token;
  };
  return { ...f, credentials, admin: request, signIn };
}

test('admin access requires the Mac key and a separate, unexpired admin session', async () => {
  const f = adminFixture();
  const team = await f.login();
  const admin = await f.signIn();
  assert.equal((await f.admin('/login', 'POST', f.credentials, null, undefined, { 'X-Advent-Device-Key': '0'.repeat(64) })).status, 401);
  assert.equal((await f.admin('/login', 'POST', { username: f.env.TEAM_USERNAME, password: f.env.TEAM_PASSWORD })).status, 401);
  assert.equal((await f.admin('/submissions')).status, 401);
  assert.equal((await f.admin('/submissions', 'GET', null, team)).status, 401);
  assert.equal((await f.admin('/submissions', 'GET', null, admin, undefined, { 'X-Advent-Device-Key': '' })).status, 401);
  assert.equal((await f.admin('/submissions', 'GET', null, admin, '2026-12-01T12:15:00Z')).status, 401);
  const crossOrigin = await f.admin('/submissions', 'GET', null, admin, undefined, { Origin: 'https://kambium89-eng.github.io' });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await f.request('/responses', 'GET', undefined, admin)).status, 401);
  const response = await f.admin('/submissions', 'GET', null, admin);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  assert.deepEqual(await response.json(), { submissions: [], next: null });
});

test('admin can redact or remove one answer and delete a submission, with conflict protection', async () => {
  const f = adminFixture();
  const team = await f.login();
  const admin = await f.signIn();
  const id = randomUUID();
  const original = ['Fictional Alex helped', 'Remove this answer', 'Keep this answer'];
  await f.request('/responses', 'POST', { submissionId: id, answers: original }, team);
  const list = await f.admin('/submissions', 'GET', null, admin);
  const [before] = (await list.json()).submissions;
  const path = `/submissions/${id}`;
  assert.equal(before.id, id);
  assert.deepEqual(before.answers, original);
  assert.equal((await f.admin(path, 'PUT', { answers: [], revision: before.revision }, admin)).status, 400);
  const edited = ['A colleague helped', 'Keep this answer'];
  const saved = await f.admin(path, 'PUT', { answers: edited, revision: before.revision }, admin);
  assert.equal(saved.status, 200);
  const { submission } = await saved.json();
  assert.equal(submission.savedAt, before.savedAt);
  assert.notEqual(submission.revision, before.revision);
  assert.equal((await f.admin(path, 'PUT', { answers: ['Stale edit'], revision: before.revision }, admin)).status, 409);
  assert.equal((await f.admin(path, 'DELETE', { revision: before.revision }, admin)).status, 409);
  const clouds = await f.request('/responses', 'GET', undefined, team);
  assert.deepEqual((await clouds.json()).answers.sort(), edited.sort());
  assert.equal((await f.admin(path, 'DELETE', { revision: submission.revision }, admin)).status, 200);
  const afterDelete = await f.request('/responses', 'GET', undefined, team);
  assert.deepEqual(await afterDelete.json(), { answers: [] });
  assert.equal((await f.admin(path, 'PUT', { answers: edited, revision: submission.revision }, admin)).status, 409);
});

test('admin submission pages preserve ordering when timestamps tie', async () => {
  const f = adminFixture();
  const admin = await f.signIn();
  const ids = Array.from({ length: 27 }, () => randomUUID()).sort().reverse();
  const insert = f.sqlite.prepare('INSERT INTO pride_responses (id, answers_json, saved_at) VALUES (?, ?, ?)');
  for (const id of ids) insert.run(id, '["Fictional entry"]', '2026-12-01T12:00:00.000Z');
  const page1 = await (await f.admin('/submissions', 'GET', null, admin)).json();
  assert.equal(page1.submissions.length, 25);
  const page2 = await (await f.admin(`/submissions?${new URLSearchParams(page1.next)}`, 'GET', null, admin)).json();
  assert.equal(page2.next, null);
  assert.deepEqual([...page1.submissions, ...page2.submissions].map(row => row.id), ids);
});

test('admin login rate limit leaves the shared team login usable', async () => {
  const f = adminFixture();
  for (let index = 0; index < 8; index++) {
    const bad = await f.admin('/login', 'POST', { ...f.credentials, password: 'wrong' });
    assert.equal(bad.status, 401);
  }
  assert.equal((await f.admin('/login', 'POST', f.credentials)).status, 429);
  assert.ok(await f.login());
  assert.equal((await f.admin('/login', 'POST', f.credentials, null, '2026-12-01T12:15:00Z')).status, 200);
});
