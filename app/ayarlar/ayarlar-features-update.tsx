// Bu kod ayarlar/page.tsx'nin Özellikler sekmesine eklenecek

// Feature flags'e eklenecek yeni özellikler:
const YENI_OZELLIKLER = [
  {
    id: 'sesli_siparis',
    baslik: '🎤 Sesli Sipariş',
    aciklama: 'Müşteri ve garson sesle sipariş verebilsin',
    kategori: 'Müşteri Deneyimi',
    varsayilan: false,
  },
  {
    id: 'dogum_gunu_indirim',
    baslik: '🎂 Doğum Günü İndirim',
    aciklama: 'Doğum günü müşterilere otomatik indirim',
    kategori: 'Müşteri Deneyimi',
    varsayilan: true,
    ayarlar: {
      indirim_orani: 20, // % olarak
      otomatik_uygula: true,
    }
  },
]

// Ayarlar sayfasında toggle'lar:
{YENI_OZELLIKLER.map(ozellik => (
  <motion.div
    key={ozellik.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between"
  >
    <div className="flex-1">
      <p className="font-bold text-white">{ozellik.baslik}</p>
      <p className="text-xs text-cyan-300/70 mt-1">{ozellik.aciklama}</p>
    </div>
    <Switch
      checked={ayarlar[ozellik.id]?.aktif ?? ozellik.varsayilan}
      onCheckedChange={() => toggleOzellik(ozellik.id)}
    />
  </motion.div>
))}
