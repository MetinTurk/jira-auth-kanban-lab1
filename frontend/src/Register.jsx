import React, { useState } from 'react';
import { api } from './api.js';
export default function Register() {
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.password !== data.confirm) return setMessage('Şifreler eşleşmiyor.');
    const form=event.currentTarget;
    setBusy(true);setMessage('');
    try { await api('register',data);setMessage('Hesabın oluşturuldu. Giriş yapabilirsin.');form.reset(); }
    catch(error){setMessage(error.message);}finally{setBusy(false);}
  }
  return <form onSubmit={submit}><h2>Hesap oluştur</h2><p>Güvenli bir başlangıç yap.</p>
    <label>Ad soyad<input name="name" autoComplete="name" required maxLength={80}/></label>
    <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label>Şifre<input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label>
    <label>Şifre tekrar<input name="confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128}/></label>
    <small>Şifren en az 10 karakter olmalı.</small><button disabled={busy}>{busy?'Kaydediliyor…':'Hesap oluştur'}</button>
    <output role="status" aria-live="polite">{message}</output></form>;
}
