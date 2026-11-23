import {emailOf,validEmail,validPassword,hashPassword,safeUser} from './core.js';
export function registerRoutes(app,{db}){
  app.post('/api/register',async(req,res)=>{
    const {name,password}=req.body??{};const email=emailOf(req.body?.email);
    if(typeof name!=='string'||name.trim().length<1||name.trim().length>80||!validEmail(email)||!validPassword(password))return res.status(400).json({error:'Ad, geçerli e-posta ve 10–128 karakterlik şifre gereklidir.'});
    const hash=await hashPassword(password);
    try{const result=db.prepare('INSERT INTO users(name,email,password) VALUES(?,?,?)').run(name.trim(),email,hash);res.status(201).json({user:safeUser({id:result.lastInsertRowid,name:name.trim(),email})});}
    catch(error){if(error.code?.startsWith('ERR_SQLITE')&&db.prepare('SELECT id FROM users WHERE email=?').get(email))return res.status(409).json({error:'Bu e-posta ile kayıt mevcut.'});throw error;}
  });
}
