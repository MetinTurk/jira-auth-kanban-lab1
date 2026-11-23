import React,{useState} from 'react';
import Register from './Register.jsx';
import Login from './Login.jsx';
import Reset from './Reset.jsx';
export default function App(){
  const [page,setPage]=useState('register');
  return <main><aside><span className="badge">PROJE YÖNETİMİ · LAB 1</span><h1>Her adımda<br/>güvenli erişim.</h1><p>Kayıt ol, giriş yap ve hesabının kontrolünü elinde tut.</p><div className="steps"><span>01 · Kayıt</span><span>02 · Giriş</span><span>03 · Şifre sıfırlama</span></div><small>React · Express · SQLite<br/>Jira & GitHub Kanban Uygulaması</small></aside><section><header>AUTH<span>LAB</span></header><nav aria-label="Kimlik işlemleri">{[['register','Kayıt'],['login','Giriş'],['reset','Şifre sıfırla']].map(([key,label])=><button key={key} aria-pressed={page===key} onClick={()=>setPage(key)}>{label}</button>)}</nav>{page==='register'?<Register/>:page==='login'?<Login/>:<Reset/>}<footer>Ders amaçlı yerel uygulama · Metin Türk</footer></section></main>;
}
