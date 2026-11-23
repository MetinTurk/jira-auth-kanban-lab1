import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const randomToken=()=>randomBytes(32).toString('hex');
export const emailOf=value=>typeof value==='string'?value.trim().toLowerCase():'';
export const validEmail=email=>email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validPassword=p=>typeof p==='string'&&p.length>=10&&p.length<=128;
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);return `${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password,stored){const [salt,hex]=stored.split(':');const actual=await scrypt(password,salt,64);const expected=Buffer.from(hex,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export function createStore(path='auth.sqlite'){
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS resets(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);`);
  return db;
}
export function safeUser(row){return {id:Number(row.id),name:row.name,email:row.email};}
