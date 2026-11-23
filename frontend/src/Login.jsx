import React,{useState} from 'react';
import {api} from './api.js';
export default function Login(){
  const [user,setUser]=useState(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  async function submit(event){event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));setBusy(true);setMessage('');try{const result=await api('login',data);setUser(result.user);}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  async function logout(){setBusy(true);try{await api('logout',{});setUser(null);setMessage('Oturum kapatıldı.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}
  return user?<div className="session"><h2>Hoş geldin, {user.name}</h2><p>{user.email}</p><p>Giriş başarılı. Oturumun güvenli çerez ile yönetiliyor.</p><button onClick={logout} disabled={busy}>Çıkış yap</button><output role="status">{message}</output></div>:<form onSubmit={submit}><h2>Tekrar hoş geldin</h2><p>Hesabına güvenle giriş yap.</p><label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Şifre<input name="password" type="password" autoComplete="current-password" required maxLength={128}/></label><button disabled={busy}>{busy?'Kontrol ediliyor…':'Giriş yap'}</button><output role="status" aria-live="polite">{message}</output></form>;
}
