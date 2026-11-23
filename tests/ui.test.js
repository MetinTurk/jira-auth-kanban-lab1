import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {createServer} from 'vite';

test('React forms show mismatch, successful registration, login error, and reset success',async t=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
  const original={window:globalThis.window,document:globalThis.document,FormData:globalThis.FormData,fetch:globalThis.fetch};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true});
  const vite=await createServer({root:'frontend',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
  const root=createRoot(document.getElementById('root'));t.after(async()=>{await act(()=>root.unmount());await vite.close();dom.window.close();Object.assign(globalThis,original);delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
  const {default:Register}=await vite.ssrLoadModule('/src/Register.jsx');
  let calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({message:'Tamam'})};};
  await act(()=>root.render(React.createElement(Register)));
  function input(name,value){document.querySelector(`[name="${name}"]`).value=value;}
  async function submit(index=0){await act(async()=>{document.querySelectorAll('form')[index].dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});}
  input('name','Test');input('email','test@example.com');input('password','strong-password');input('confirm','different-password');await submit();
  assert.match(document.body.textContent,/Şifreler eşleşmiyor/);assert.equal(calls.length,0);
  input('confirm','strong-password');await submit();assert.equal(calls[0].url,'/api/register');assert.match(document.body.textContent,/Hesabın oluşturuldu/);
  const {default:Login}=await vite.ssrLoadModule('/src/Login.jsx');await act(()=>root.render(React.createElement(Login)));
  globalThis.fetch=async()=>({ok:false,json:async()=>({error:'E-posta veya şifre hatalı.'})});input('email','test@example.com');input('password','wrong');await submit();assert.match(document.body.textContent,/E-posta veya şifre hatalı/);
  const {default:Reset}=await vite.ssrLoadModule('/src/Reset.jsx');await act(()=>root.render(React.createElement(Reset)));
  globalThis.fetch=async()=>({ok:true,json:async()=>({message:'Tamam'})});input('token','a'.repeat(64));input('password','new-strong-password');input('confirm','new-strong-password');await submit(1);assert.match(document.body.textContent,/Şifren güncellendi/);
});
