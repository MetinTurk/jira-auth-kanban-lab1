import express from 'express';
import {createStore} from './core.js';
import {registerRoutes} from './register.js';
import {loginRoutes} from './login.js';
import {resetRoutes} from './reset.js';
export async function createApp(options={}){
  const app=express(),db=options.db??createStore(options.dbPath);
  const context={...options,db};app.disable('x-powered-by');
  app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'});next();});
  app.use('/api',(req,res,next)=>{
    if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Farklı kaynaktan gelen istek reddedildi.'});
    next();
  });
  // Bounded single-process demo limiter; configure a shared limiter before public deployment.
  const attempts=new Map();
  app.use('/api',(req,res,next)=>{
    const now=Date.now();for(const [key,value] of attempts)if(value.until<=now)attempts.delete(key);
    const key=req.ip;const entry=attempts.get(key)??{count:0,until:now+60000};entry.count++;
    if(!attempts.has(key)&&attempts.size>=10000)return res.status(503).json({error:'Lütfen daha sonra deneyin.'});
    attempts.set(key,entry);if(entry.count>60)return res.status(429).json({error:'Çok fazla istek. Bir dakika sonra deneyin.'});next();
  });
  app.use(express.json({limit:'8kb'}));
  app.use('/api',(req,res,next)=>{if(req.method==='POST'&&!req.is('application/json'))return res.status(415).json({error:'JSON içerik gereklidir.'});next();});
  registerRoutes(app,context);await loginRoutes(app,context);resetRoutes(app,context);
  app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint bulunamadı.'}));
  app.use((error,_req,res,_next)=>{const status=error.status===400?400:error.status===413?413:500;res.status(status).json({error:status===500?'Sunucu hatası.':status===413?'İstek çok büyük.':'Geçersiz JSON.'});});
  return {app,db};
}
