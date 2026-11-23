import {emailOf,validEmail,verifyPassword,hashPassword,digest,randomToken,safeUser} from './core.js';
export async function loginRoutes(app,{db,clock=Date.now,production=false}){
  const dummyHash=await hashPassword(randomToken());
  const cookie=(token,age)=>`session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${age}${production?'; Secure':''}`;
  app.post('/api/login',async(req,res)=>{
    const email=emailOf(req.body?.email),password=req.body?.password;
    if(!validEmail(email)||typeof password!=='string'||password.length>128)return res.status(400).json({error:'Geçerli e-posta ve şifre gereklidir.'});
    const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);
    const matches=await verifyPassword(password,row?.password??dummyHash);
    if(!row||!matches)return res.status(401).json({error:'E-posta veya şifre hatalı.'});
    const token=randomToken();db.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').run(digest(token),row.id,clock()+3600000);
    res.set('Set-Cookie',cookie(token,3600)).json({user:safeUser(row)});
  });
  app.get('/api/me',(req,res)=>{
    const token=(req.headers.cookie??'').match(/(?:^|;\s*)session=([a-f0-9]{64})(?:;|$)/)?.[1];
    const row=token&&db.prepare('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token=? AND expires>?').get(digest(token),clock());
    if(!row)return res.status(401).json({error:'Oturum geçersiz veya süresi dolmuş.'});
    res.json({user:safeUser(row)});
  });
  app.post('/api/logout',(req,res)=>{const token=(req.headers.cookie??'').match(/(?:^|;\s*)session=([a-f0-9]{64})(?:;|$)/)?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));res.set('Set-Cookie',cookie('',0)).json({message:'Oturum kapatıldı.'});});
}
