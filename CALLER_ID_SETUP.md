# 📞 Arayan Numara Tanıma (Caller ID) Sistemi Kurulum Rehberi

## 🎯 Nedir?

Tuşlu telefon, VoIP, Asterisk, 3CX gibi herhangi bir santral sisteminden gelen aramaları otomatik olarak tanır. Arama geldiğinde:
- ✅ Arayan numarası gösterilir
- ✅ Müşteri adı (varsa) gösterilir
- ✅ Arama kaydedilir
- ✅ Canlı bildirim çıkar
- ✅ Numarayı tıklayarak müşteri kaydını açabilirsiniz

---

## 🔧 Webhook Endpoint

```
POST /api/caller-id
```

### Veri Formatı

```json
{
  "event": "incoming_call",
  "caller_number": "+905551234567",
  "caller_name": "Ahmet Müşteri",
  "called_number": "+905559876543",
  "call_id": "call-12345-67890",
  "timestamp": "2026-07-02T10:30:00Z",
  "restoran_id": "uuid (opsiyonel)"
}
```

**Zorunlu Alanlar:**
- `event`: `"incoming_call"` (sabit)
- `caller_number`: Arayan numarası
- `called_number`: Aranan numarası (restoranın telefonu)

**Opsiyonel Alanlar:**
- `caller_name`: Arayan kişinin adı
- `call_id`: Benzersiz arama ID'si
- `timestamp`: Arama saati (default: şu an)
- `restoran_id`: Restoran UUID (otomatik bulunur)

---

## 🚀 Kurulum Adımları

### 1️⃣ Asterisk PBX (Linux)

**Dosya:** `/etc/asterisk/extensions.conf`

```ini
[from-internal]
exten => _X.,1,NoOp(Incoming call from ${CALLERID(num)})
exten => _X.,n,System(curl -X POST https://YOUR_DOMAIN/api/caller-id \
  -H "Content-Type: application/json" \
  -d '{"event":"incoming_call","caller_number":"${CALLERID(num)}","caller_name":"${CALLERID(name)}","called_number":"${EXTEN}","call_id":"${UNIQUEID}","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}')
exten => _X.,n,Dial(SIP/2000)
```

**Yeniden Başlat:**
```bash
asterisk -rx "dialplan reload"
```

---

### 2️⃣ 3CX (Windows/Linux)

**Adımlar:**
1. **3CX Management Console** → **Settings** → **Webhooks**
2. **Event:** `Incoming Call`
3. **URL:** `https://YOUR_DOMAIN/api/caller-id`
4. **Method:** `POST`
5. **Body Template:**
```json
{
  "event": "incoming_call",
  "caller_number": "{SourceNumber}",
  "caller_name": "{SourceDisplayName}",
  "called_number": "{DestinationNumber}",
  "call_id": "{CallID}",
  "timestamp": "{TimeStamp}"
}
```

---

### 3️⃣ Avaya / Cisco / Grandstream

**Genel Webhook Ayarları:**
- **URL:** `https://YOUR_DOMAIN/api/caller-id`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Trigger:** Incoming Call / Ringing

**Örnek cURL:**
```bash
curl -X POST https://YOUR_DOMAIN/api/caller-id \
  -H "Content-Type: application/json" \
  -d '{
    "event": "incoming_call",
    "caller_number": "+905551234567",
    "caller_name": "Müşteri Adı",
    "called_number": "+905559876543",
    "call_id": "call-123",
    "timestamp": "2026-07-02T10:30:00Z"
  }'
```

---

### 4️⃣ Zapier Entegrasyonu

**Adımlar:**
1. **Zapier** → **Create Zap**
2. **Trigger:** Webhook (Catch Raw Hook)
3. **Action:** HTTP Request
4. **URL:** `https://YOUR_DOMAIN/api/caller-id`
5. **Method:** `POST`
6. **Headers:** `Content-Type: application/json`
7. **Body:** Santral verilerini JSON'a dönüştür

---

### 5️⃣ Kendi Yazılımınızdan

**Python Örneği:**
```python
import requests
import json
from datetime import datetime

def send_incoming_call(caller_number, called_number, caller_name=None):
    payload = {
        "event": "incoming_call",
        "caller_number": caller_number,
        "caller_name": caller_name or f"Müşteri {caller_number}",
        "called_number": called_number,
        "call_id": f"call-{datetime.now().timestamp()}",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    response = requests.post(
        "https://YOUR_DOMAIN/api/caller-id",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    return response.json()

# Kullanım
send_incoming_call("+905551234567", "+905559876543", "Ahmet Müşteri")
```

**Node.js Örneği:**
```javascript
async function sendIncomingCall(callerNumber, calledNumber, callerName) {
  const payload = {
    event: "incoming_call",
    caller_number: callerNumber,
    caller_name: callerName || `Müşteri ${callerNumber}`,
    called_number: calledNumber,
    call_id: `call-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  const response = await fetch("https://YOUR_DOMAIN/api/caller-id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return response.json();
}

// Kullanım
sendIncomingCall("+905551234567", "+905559876543", "Ahmet Müşteri");
```

---

## 🧪 Test Etme

### Test Endpoint
```
GET /api/caller-id?test=true
```

### cURL ile Test
```bash
curl -X POST https://YOUR_DOMAIN/api/caller-id \
  -H "Content-Type: application/json" \
  -d '{
    "event": "incoming_call",
    "caller_number": "+905551234567",
    "caller_name": "Test Müşteri",
    "called_number": "+905559876543",
    "call_id": "test-call-001",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### Beklenen Yanıt
```json
{
  "success": true,
  "message": "Gelen arama kaydedildi",
  "data": {
    "call_id": "test-call-001",
    "restoran_id": "uuid",
    "musteri_id": "uuid",
    "musteri_ad": "Test Müşteri",
    "musteri_telefon": "5551234567",
    "arayan_numara": "5551234567",
    "durum": "ringing"
  }
}
```

---

## 📱 Mobil Uygulamada Görünüş

Arama geldiğinde ekranda:
- 📞 **Gelen Arama** başlığı
- 📱 **Arayan Numarası** (büyük yazı)
- 👤 **Müşteri Adı** (kayıtlıysa)
- 🔔 **Ses Bildirimi** (tarayıcı izin verirse)
- 3 Buton:
  - ❌ **Reddet**
  - 💬 **SMS Gönder**
  - ✅ **Yanıtla**

---

## 🔒 Güvenlik

1. **HTTPS Kullan:** Tüm webhook URL'leri HTTPS olmalı
2. **Firewall:** Santral IP'sini whitelist'e ekle (opsiyonel)
3. **Rate Limiting:** Aynı numaradan çok fazla arama varsa kontrol et
4. **Veri Şifreleme:** Hassas bilgiler için encryption ekle

---

## 🐛 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Arama kaydı oluşturulmuyor | Restoran telefon numarasını Ayarlar'dan kaydet |
| Müşteri otomatik oluşturulmuyor | Numarası normalize edilip veritabanında kontrol et |
| Bildirim çıkmıyor | Tarayıcı izinlerini kontrol et, Supabase Realtime aktif mi? |
| Webhook çağrılmıyor | Santral URL'sini doğru gir, firewall kurallarını kontrol et |

---

## 📞 Desteklenen Sistemler

✅ Asterisk PBX
✅ 3CX
✅ Avaya
✅ Cisco
✅ Grandstream
✅ Yealink
✅ Twilio
✅ Zapier
✅ Make (Integromat)
✅ Kendi yazılımınız (HTTP POST)

---

## 📚 Kaynaklar

- [Asterisk Dialplan Docs](https://wiki.asterisk.org/wiki/display/AST/Dialplan)
- [3CX Webhooks](https://www.3cx.com/docs/manual/webhooks/)
- [Zapier Webhooks](https://zapier.com/help/doc/how-get-started-webhooks)

---

**Sorular?** İletişim: support@restoranpro.com
