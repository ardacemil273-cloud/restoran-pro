'use client'

// FisYazdir.tsx - Termal yazıcıya uygun kasa ve mutfak fişi bileşeni

interface SiparisUrun {
  id: string
  adet: number
  birim_fiyat: number
  urunler: { ad: string; fiyat: number }
}

interface Siparis {
  id: string
  masa_ad: string
  durum: string
  not?: string | null
  toplam_tutar: number
  created_at: string
  siparis_urunleri: SiparisUrun[]
}

interface FisYazdirProps {
  siparis: Siparis
  restoranAd: string
  restoranTelefon?: string
  restoranAdres?: string
  tip: 'kasa' | 'mutfak'
}

export function fisYazdir({ siparis, restoranAd, restoranTelefon, restoranAdres, tip }: FisYazdirProps) {
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) {
    alert('Popup engellendi. Lütfen tarayıcı ayarlarından popup\'a izin verin.')
    return
  }

  const tarih = new Date(siparis.created_at)
  const tarihStr = tarih.toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const saatStr = tarih.toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const fisSayisi = `#${siparis.id.slice(-6).toUpperCase()}`

  if (tip === 'kasa') {
    // KASA FİŞİ - Müşteriye verilecek tam fiş
    const urunlerHTML = siparis.siparis_urunleri.map(item => {
      const tutar = item.adet * item.birim_fiyat
      return `
        <tr>
          <td style="padding:3px 0; font-size:13px;">${item.urunler.ad}</td>
          <td style="text-align:center; padding:3px 4px; font-size:13px;">${item.adet}</td>
          <td style="text-align:right; padding:3px 0; font-size:13px;">${item.birim_fiyat.toFixed(2)}₺</td>
          <td style="text-align:right; padding:3px 0; font-size:13px; font-weight:bold;">${tutar.toFixed(2)}₺</td>
        </tr>
      `
    }).join('')

    const kdvTutari = siparis.toplam_tutar * 0.10
    const kdvHaricTutar = siparis.toplam_tutar - kdvTutari

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Kasa Fişi - ${siparis.masa_ad}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              max-width: 80mm;
              padding: 4mm 6mm;
              font-size: 13px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
            .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; margin-bottom: 4px; }
            .subtitle { font-size: 11px; color: #333; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; }
            th { font-size: 11px; text-align: left; padding: 2px 0; border-bottom: 1px solid #000; }
            th:nth-child(2) { text-align: center; }
            th:nth-child(3), th:nth-child(4) { text-align: right; }
            .total-row { font-size: 15px; font-weight: bold; }
            .total-box {
              border: 2px solid #000;
              padding: 6px;
              margin: 8px 0;
              text-align: center;
            }
            .total-amount { font-size: 22px; font-weight: bold; }
            .footer { font-size: 11px; text-align: center; margin-top: 8px; }
            .badge {
              display: inline-block;
              border: 1px solid #000;
              padding: 1px 6px;
              font-size: 11px;
              margin-top: 2px;
            }
            @media print {
              body { margin: 0; padding: 4mm 6mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="logo">${restoranAd}</div>
            ${restoranAdres ? `<div class="subtitle">${restoranAdres}</div>` : ''}
            ${restoranTelefon ? `<div class="subtitle">Tel: ${restoranTelefon}</div>` : ''}
          </div>
          
          <div class="divider-solid"></div>
          
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span><b>Fiş No:</b> ${fisSayisi}</span>
            <span class="badge">KASA FİŞİ</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span><b>Masa:</b> ${siparis.masa_ad}</span>
            <span>${tarihStr}</span>
          </div>
          <div style="text-align:right; font-size:12px; margin-bottom:4px;">
            <span>${saatStr}</span>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th>ÜRÜN</th>
                <th style="text-align:center;">AD</th>
                <th style="text-align:right;">BİRİM</th>
                <th style="text-align:right;">TUTAR</th>
              </tr>
            </thead>
            <tbody>
              ${urunlerHTML}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="display:flex; justify-content:space-between; font-size:12px; margin:3px 0;">
            <span>Ara Toplam (KDV Hariç):</span>
            <span>${kdvHaricTutar.toFixed(2)}₺</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin:3px 0;">
            <span>KDV (%10):</span>
            <span>${kdvTutari.toFixed(2)}₺</span>
          </div>
          
          <div class="total-box">
            <div style="font-size:12px; margin-bottom:2px;">TOPLAM TUTAR</div>
            <div class="total-amount">${siparis.toplam_tutar.toFixed(2)}₺</div>
          </div>
          
          ${siparis.not ? `
          <div style="border:1px dashed #000; padding:5px; margin:6px 0; font-size:12px;">
            <b>Sipariş Notu:</b> ${siparis.not}
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="footer">
            <div>Bizi tercih ettiğiniz için teşekkürler!</div>
            <div style="margin-top:4px;">Afiyet olsun 🍽️</div>
            <div style="margin-top:6px; font-size:10px; color:#666;">
              ${new Date().toLocaleString('tr-TR')}
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()

  } else {
    // MUTFAK FİŞİ - Sadece hazırlanacak ürünler, büyük font
    const urunlerHTML = siparis.siparis_urunleri.map(item => `
      <div class="urun-satir">
        <span class="adet">${item.adet}x</span>
        <span class="urun-ad">${item.urunler.ad}</span>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Mutfak Fişi - ${siparis.masa_ad}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              max-width: 80mm;
              padding: 4mm 6mm;
              font-size: 14px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .divider { border-top: 2px dashed #000; margin: 8px 0; }
            .divider-solid { border-top: 3px solid #000; margin: 8px 0; }
            .masa-baslik {
              font-size: 28px;
              font-weight: bold;
              text-align: center;
              padding: 8px;
              border: 3px solid #000;
              margin: 8px 0;
              letter-spacing: 2px;
            }
            .badge-mutfak {
              background: #000;
              color: #fff;
              text-align: center;
              padding: 4px;
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .urun-satir {
              display: flex;
              align-items: baseline;
              gap: 8px;
              padding: 6px 0;
              border-bottom: 1px dashed #ccc;
              font-size: 18px;
            }
            .adet {
              font-size: 22px;
              font-weight: bold;
              min-width: 40px;
            }
            .urun-ad {
              font-size: 18px;
              font-weight: bold;
            }
            .not-kutu {
              border: 2px solid #000;
              padding: 6px;
              margin-top: 8px;
              font-size: 15px;
            }
            .zaman { font-size: 13px; text-align: center; margin-top: 8px; }
            @media print {
              body { margin: 0; padding: 4mm 6mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <div class="badge-mutfak">★ MUTFAK FİŞİ ★</div>
          
          <div class="masa-baslik">${siparis.masa_ad}</div>
          
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
            <span>Fiş: ${fisSayisi}</span>
            <span>${saatStr}</span>
          </div>
          
          <div class="divider-solid"></div>
          
          <div>
            ${urunlerHTML}
          </div>
          
          ${siparis.not ? `
          <div class="not-kutu">
            <b>⚠️ NOT:</b> ${siparis.not}
          </div>
          ` : ''}
          
          <div class="zaman">${tarihStr} ${saatStr}</div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }
}
