import {createApp} from './app.js';
import {fileURLToPath} from 'node:url';
import express from 'express';
const production=process.env.NODE_ENV==='production';
const {app,db}=await createApp({dbPath:process.env.DB_PATH??'auth.sqlite',production,demoReset:process.env.DEMO_RESET_TOKENS==='true'});
app.use(express.static(fileURLToPath(new URL('../frontend/dist',import.meta.url))));
const server=app.listen(Number(process.env.PORT??3000),'127.0.0.1',()=>console.log('Auth Lab hazır: http://127.0.0.1:'+server.address().port));
function shutdown(){server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
