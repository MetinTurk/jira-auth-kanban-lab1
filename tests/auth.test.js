import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../backend/app.js';
import {createStore,digest} from '../backend/core.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
async function fixture(t,options={}){
  let now=1700000000000;
  const db=createStore(':memory:');const {app}=await createApp({db,clock:()=>now,demoReset:true,...options});
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(r=>server.close(r));db.close();});
  const post=async(path,body,headers={})=>{const res=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')};};
  return {db,base,post,advance:ms=>{now+=ms;}};
}
const user={name:'Test Kullanıcı',email:'test@example.com',password:'old-strong-password'};
test('register persists a salted hash and rejects malformed/duplicate data',async t=>{
  const {post,db}=await fixture(t);
  assert.equal((await post('register',{})).status,400);
  assert.equal((await post('register',{...user,email:'invalid'})).status,400);
  assert.equal((await post('register',{...user,password:'short'})).status,400);
  const result=await post('register',user);assert.equal(result.status,201);assert.equal(result.body.user.password,undefined);
  const row=db.prepare('SELECT * FROM users').get();assert.notEqual(row.password,user.password);assert.match(row.password,/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.equal((await post('register',{...user,email:' TEST@EXAMPLE.COM '})).status,409);
});
test('login validates credentials, stores only session hash, expires and logs out',async t=>{
  const {post,db,base,advance}=await fixture(t);await post('register',user);
  const wrong=await post('login',{...user,password:'wrong'}),absent=await post('login',{...user,email:'absent@example.com'});
  assert.equal(wrong.status,401);assert.deepEqual(wrong.body,absent.body);
  const login=await post('login',user);assert.equal(login.status,200);assert.match(login.cookie,/HttpOnly/);assert.match(login.cookie,/SameSite=Strict/);
  const token=login.cookie.match(/session=([^;]+)/)[1];assert.equal(db.prepare('SELECT token FROM sessions').get().token,digest(token));
  assert.equal((await fetch(base+'/api/me',{headers:{cookie:login.cookie}})).status,200);
  assert.equal((await post('logout',{}, {cookie:login.cookie})).status,200);
  assert.equal((await fetch(base+'/api/me',{headers:{cookie:login.cookie}})).status,401);
  const again=await post('login',user);advance(3600001);
  assert.equal((await fetch(base+'/api/me',{headers:{cookie:again.cookie}})).status,401);
});
test('password reset changes credentials, revokes sessions, and consumes token once',async t=>{
  const {post,db,base}=await fixture(t);await post('register',user);const login=await post('login',user);
  const reset=await post('forgot-password',{email:user.email});const token=reset.body.demoToken;
  assert.equal(db.prepare('SELECT token FROM resets').get().token,digest(token));
  const next='new-strong-password';assert.equal((await post('reset-password',{token,password:next})).status,200);
  assert.equal((await post('reset-password',{token,password:next})).status,400);
  assert.equal((await post('login',user)).status,401);assert.equal((await post('login',{...user,password:next})).status,200);
  assert.equal((await fetch(base+'/api/me',{headers:{cookie:login.cookie}})).status,401);
});
test('expired and superseded reset tokens fail; unknown users get same response shape',async t=>{
  const {post,advance}=await fixture(t);await post('register',user);
  const first=await post('forgot-password',{email:user.email});const second=await post('forgot-password',{email:user.email});
  assert.equal((await post('reset-password',{token:first.body.demoToken,password:'new-strong-password'})).status,400);
  advance(900001);assert.equal((await post('reset-password',{token:second.body.demoToken,password:'new-strong-password'})).status,400);
  const absent=await post('forgot-password',{email:'absent@example.com'});
  assert.deepEqual(Object.keys(absent.body),Object.keys(first.body));assert.equal(absent.body.message,first.body.message);
});
test('concurrent requests cannot redeem the same reset token twice',async t=>{
  const {post}=await fixture(t);await post('register',user);const reset=await post('forgot-password',{email:user.email});
  const results=await Promise.all([1,2].map(()=>post('reset-password',{token:reset.body.demoToken,password:'new-strong-password'})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
});
test('production hides demo tokens and sends Secure cookies',async t=>{
  const {post}=await fixture(t,{production:true});await post('register',user);
  assert.equal((await post('forgot-password',{email:user.email})).body.demoToken,undefined);
  assert.match((await post('login',user)).cookie,/; Secure/);
});
test('API rejects cross-origin, malformed JSON, oversized bodies and excessive requests',async t=>{
  const {post,base}=await fixture(t);
  assert.equal((await post('login',user,{origin:'https://other.example'})).status,403);
  const malformed=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
  assert.equal((await post('register',{...user,name:'x'.repeat(9000)})).status,413);
  assert.equal((await fetch(base+'/api/login',{method:'POST',body:'hello'})).status,415);
  let status;for(let i=0;i<61;i++)status=(await fetch(base+'/api/me')).status;assert.equal(status,429);
});
test('SQLite survives close and reopen',()=>{
  const folder=mkdtempSync(join(tmpdir(),'auth-lab-'));try{const path=join(folder,'test.sqlite');const db=createStore(path);db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run('Test','persist@example.com','test-only-hash');db.close();const reopened=createStore(path);assert.equal(reopened.prepare('SELECT name FROM users').get().name,'Test');reopened.close();}finally{rmSync(folder,{recursive:true});}
});
