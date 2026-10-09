# Restoran Pro — Satışa Hazır SaaS Vitrini

## Ürün amacı
Restoran sahiplerinin QR menü, sipariş, mutfak, stok, kasa ve müşteri operasyonlarını tek panelden yönetebileceğini hızlıca anlamasını sağlayan; denemeye ve satış görüşmesine yönlendiren bir ana sayfa.

## Uygulama yaklaşımı
- Mevcut Next.js uygulaması ve Supabase oturum akışı korunur.
- Ana sayfa, oturum yoksa satış vitrini; oturum varsa mevcut `/masalar` yönlendirmesi olarak kalır.
- Ana sayfada gerçek backend gerektirmeyen, satış görüşmesini destekleyen interaktif ROI hesaplayıcı bulunur.
- Ürünün gerçek modülleri mevcut route’lara bağlanır; demo dashboard görseli demo verisi olarak etiketlenir.
- `/manus-routes.json` ile mevcut route manifesti yayınlanır.

## Tasarım sistemi
- **Design Movement:** Editorial dark SaaS / operasyon kokpiti. Koyu mürekkep zemin üzerinde sıcak amber vurgu ve net tipografik hiyerarşi.
- **Core Principles:** hızlı taranabilirlik, güven veren yoğunluk, ölçülebilir fayda, gereksiz süsten kaçınma.
- **Color Philosophy:** `#0d1117` güven ve gece operasyonunu; amber `#f59e0b` sipariş akışını ve aksiyonu; mint `#7dd3b0` kârlılık ve kontrolü temsil eder.
- **Layout Paradigm:** merkezde tek slogan yerine sol metin + sağ canlı ürün kokpiti; aşağıda yatay kanıt şeridi, sonra asimetrik modül kartları.
- **Signature Elements:** amber “pulse” çizgisi, cam yüzeyli mini dashboard, bölüm başlıklarında küçük monospaced etiketler.
- **Interaction Philosophy:** her etkileşim bir işletme sonucuna bağlanır; ROI slider’ları anında aylık etkiyi günceller.
- **Animation:** yalnızca hover/transform ve yumuşak girişler; `prefers-reduced-motion` desteklenir.
- **Typography:** Geist/Inter tabanlı sans; eyebrow ve metriklerde monospaced yardımcı hiyerarşi.
- **Brand Essence:** “Restoranın dağınık operasyonunu tek bakışta yönetilebilir kılan sakin kokpit.” Kişilik: net, pratik, iddialı.
- **Brand Voice:** “Yoğun serviste bile kontrol sizde.” / “Bugün kaçan siparişi değil, yarının kârlılığını yönetin.”
- **Wordmark & Logo:** amber çerçeveli servis cloche/şef rozeti; metin yanında kompakt kare işaret.
- **Signature Brand Color:** sıcak amber `#f59e0b`.

## Proje yapısı
- `app/page.tsx`: satış landing page, fiyatlar, özellikler, ROI hesaplayıcı, SSS ve CTA.
- `public/manus-routes.json`: sayfa route manifesti.
- `plan.md`: ürün ve tasarım kararları.
- `TODO.md`: teslim kriterleri.

## Kapsam dışı
Ödeme sağlayıcısı, CRM lead kaydı ve yeni backend endpoint’i bu iterasyonda eklenmez; CTA’lar mevcut kayıt/giriş akışlarına bağlanır.
