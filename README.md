# Auth Kanban Lab1

Bilgisayar Mühendisliğinde Proje Yönetimi — Jira & GitHub Kanban Uygulaması.

**Öğrenci:** Metin Türk. Çalışma bireyseldir; bağımsız ekip arkadaşı review/Approve yapılmamıştır. Bu sınırlama üç kişilik ekip senaryosunu karşılamaz ve ders sorumlusuna bildirilmelidir.

## Kurulum

Node.js **24 veya üzeri** gerekir (`node:sqlite` kullanılır).

```bash
npm ci
cp .env.example .env
npm run build
npm start
```

http://127.0.0.1:3000 adresini açın. SQLite dosyası ilk çalışmada oluşturulur. Uygulama yalnızca yerel bilgisayarda dinler.

Geliştirme için iki terminalde `npm start` ve `npm run dev` çalıştırın; Vite adresi http://127.0.0.1:5173 olur. Vite `/api` isteklerini backend'e aktarır.

## Akışlar

- Kayıt: ad, e-posta, en az 10 karakter şifre ve şifre doğrulama.
- Giriş: e-posta/şifre, 1 saatlik HttpOnly ve SameSite=Strict oturum çerezi; çıkış ile iptal.
- Sıfırlama: istek → 15 dakikalık kod → yeni şifre → yeniden giriş. Kod yalnızca bir kez kullanılabilir. Eski oturumlar iptal edilir.

**Gerçek e-posta gönderimi yoktur.** Yerel sıfırlama demosu için `.env` içinde `DEMO_RESET_TOKENS=true` yapıp sunucuyu yeniden başlatın. API'nin verdiği demo kodu formda otomatik doldurulur. Var olmayan hesaplara da gerçek olmayan demo kodu dönülür; bunlar şifre değiştiremez. Üretim modunda demo kodu hiçbir zaman dönmez. Üretime çıkarılacak sürümde güvenilir e-posta teslimatı ayrıca uygulanmalıdır; bu depo yerel ders demosudur.

## Mimari ve güvenlik

React/Vite → aynı kaynak `/api` → Express → SQLite. `backend/core.js` veritabanı ve kriptografi yardımcılarını; `register.js`, `login.js`, `reset.js` ilgili endpoint'leri içerir. `app.js` doğrulama, JSON boyut sınırı, kaynak kontrolü, oran sınırlaması ve hata yanıtlarını bağlar.

Şifreler rastgele salt ve scrypt ile hashlenir. Sıfırlama/oturum token'larının yalnızca SHA-256 özeti saklanır. Sıfırlama token'ının tüketimi SQLite transaction içinde yapılır. SQL parametreleri kullanılır. `NODE_ENV=production` çereze Secure ekler; HTTPS gerekir. Yerel bellek oran sınırlaması tek süreç içindir. SQLite dosyası hassas veri içerdiğinden dağıtımda dosya izinleri, yedekler ve HTTPS yapılandırması ayrıca ele alınmalıdır.

## Test

```bash
npm test
npm run build
```

9 otomatik test: kayıt/doğrulama/mükerrer e-posta; giriş/oturum/çıkış/süre; sıfırlama/tek kullanımlılık/eski oturum iptali; süresi dolmuş ve yenilenmiş kodlar; eşzamanlı kod tüketimi; üretimde kod gizleme ve Secure çerez; kötü JSON/boyut/kaynak/oran kontrolü; SQLite kalıcılığı; React formlarında hata ve başarı durumları.

React testinde API yanıtları kontrollü mock'tur. API testleri gerçek HTTP sunucusu ve SQLite kullanır. Gerçek e-posta teslimatı veya gerçek bir ekip arkadaşı review'ü test edilmiş sayılmaz.

## Jira–GitHub izlenebilirliği

Jira: https://metinturk553.atlassian.net/jira/software/projects/KAN/boards/2

| Jira | Görev | Tahmin | Branch |
| --- | --- | --- | --- |
| KAN-1 | Kayıt ekranı | 3 saat | KAN-1-kayit-ekrani |
| KAN-2 | Giriş ekranı | 2 saat | KAN-2-giris-ekrani |
| KAN-4 | Sıfırlama ekranı | 3 saat | KAN-4-sifre-sifirlama-ekrani |
| KAN-5 | Register API | 4 saat | KAN-5-register-api |
| KAN-6 | Login API | 3 saat | KAN-6-login-api |
| KAN-7 | Sıfırlama API | 4 saat | KAN-7-reset-password-api |
| KAN-8 | Entegrasyon testleri | 3 saat | KAN-8-entegrasyon-testleri |

Toplam 22 saat. Jira'nın gerçek anahtarları kullanılır; numaralandırmadaki boşluk yeni görev oluşturmayı gerektirmez. Workflow: To Do → In Progress → Code Review → Testing → Done. Branch, commit ve PR başlıkları ilgili Jira anahtarıyla başlar. Uygulamanın kurulması ile Development panelinde commit görünmesi ayrı doğrulama adımlarıdır.
