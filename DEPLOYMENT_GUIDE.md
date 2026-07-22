# 🚀 Vercel Deployment Rehberi

## Hızlı Başlangıç

### 1. Vercel'e Bağlan
```bash
npm install -g vercel
vercel login
```

### 2. Ortam Değişkenlerini Ayarla
Vercel Dashboard'da şu değişkenleri ekle:

```
NEXT_PUBLIC_SUPABASE_URL=https://xuzqsnqdlmolpfdjkbkx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_APP_URL=https://restoran-pro.vercel.app
```

### 3. Deploy Et
```bash
vercel deploy --prod
```

---

## Ortam Değişkenleri (Environment Variables)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (private)

### OpenAI (AI Garson için)
- `OPENAI_API_KEY` - OpenAI API key

### Uygulama
- `NEXT_PUBLIC_APP_URL` - Uygulamanın URL'si (production için)

---

## Deployment Kontrol Listesi

- [ ] `.env.local` dosyası `.gitignore`'da mı?
- [ ] Tüm ortam değişkenleri Vercel'de ayarlandı mı?
- [ ] Build lokal olarak başarılı mı? (`npm run build`)
- [ ] Tüm TypeScript hataları çözüldü mü?
- [ ] Supabase migration'ları uygulandı mı?
- [ ] Database bağlantısı test edildi mi?

---

## Sık Karşılaşılan Hatalar

### Error: supabaseUrl is required
**Çözüm:** Vercel'de `NEXT_PUBLIC_SUPABASE_URL` ortam değişkenini ekle

### Error: Cannot find module
**Çözüm:** `npm install` çalıştır ve bağımlılıkları kontrol et

### Build timeout
**Çözüm:** Vercel build settings'de timeout'ı artır (Pro plan gerekli)

---

## Canlı Kontrol

Deploy edildikten sonra:

1. **Ana sayfa açılıyor mu?** → https://restoran-pro.vercel.app
2. **Login çalışıyor mu?** → Supabase auth test et
3. **API'ler çalışıyor mu?** → `/api/ozellik-ayarlari` test et
4. **Veritabanı bağlantısı var mı?** → Ayarlar sayfasını aç

---

## Rollback (Geri Al)

Bir şey yanlış giderse:
```bash
vercel rollback
```

---

## Monitoring

Vercel Dashboard'da:
- Deployment logs
- Function logs
- Error tracking
- Performance metrics

---

Başarılı deployment'lar için! 🚀
