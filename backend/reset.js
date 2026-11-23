import {emailOf,validEmail,validPassword,hashPassword,digest,randomToken} from './core.js';
export function resetRoutes(app,{db,clock=Date.now,demoReset=false,production=false}){
  app.post('/api/forgot-password',(req,res)=>{
    const email=emailOf(req.body?.email);if(!validEmail(email))return res.status(400).json({error:'Geçerli e-posta gereklidir.'});
    const user=db.prepare('SELECT id FROM users WHERE email=?').get(email);const token=randomToken();
    if(user){db.prepare('DELETE FROM resets WHERE user_id=?').run(user.id);db.prepare('INSERT INTO resets(token,user_id,expires) VALUES(?,?,?)').run(digest(token),user.id,clock()+900000);}
    const result={message:'Hesap varsa sıfırlama isteği alındı. Yerel demo dışında e-posta teslimatı ayrıca yapılandırılmalıdır.'};
    // A dummy token for absent users prevents the demo response revealing account existence.
    if(demoReset&&!production)result.demoToken=token;
    res.json(result);
  });
  app.post('/api/reset-password',async(req,res)=>{
    const {token,password}=req.body??{};
    if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!validPassword(password))return res.status(400).json({error:'Geçerli kod ve 10–128 karakterlik şifre gereklidir.'});
    const hash=await hashPassword(password);
    db.exec('BEGIN IMMEDIATE');
    try{
      const reset=db.prepare('SELECT * FROM resets WHERE token=? AND expires>?').get(digest(token),clock());
      if(!reset){db.exec('ROLLBACK');return res.status(400).json({error:'Kod geçersiz, kullanılmış veya süresi dolmuş.'});}
      db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,reset.user_id);
      db.prepare('DELETE FROM resets WHERE user_id=?').run(reset.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
      db.exec('COMMIT');res.json({message:'Şifre güncellendi.'});
    }catch(error){db.exec('ROLLBACK');throw error;}
  });
}
