const fetch = require('node-fetch');

const testOrder = {
    order_id: "YS-" + Math.floor(Math.random() * 1000000),
    customer_name: "Test Kullanıcı",
    customer_phone: "05551112233",
    items: [
        { name: "Adana Kebap", quantity: 2, price: 250 },
        { name: "Ayran", quantity: 2, price: 40 }
    ],
    total_price: 580,
    delivery_address: "Test Mahallesi, Deneme Sokak, No: 1, Daire: 1, İstanbul",
    notes: "Lütfen acı bol olsun, kapıyı çalmayın."
};

async function sendTestWebhook() {
    const url = 'http://localhost:3000/api/yemeksepeti/webhook';
    // Not: Gerçek ortamda bu URL Vercel URL'niz olacak: https://restoran-pro.vercel.app/api/yemeksepeti/webhook
    
    console.log('🚀 Yemeksepeti Test Siparişi Gönderiliyor...');
    console.log('📦 Sipariş ID:', testOrder.order_id);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrder)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Başarılı:', result);
        } else {
            console.log('❌ Hata:', result);
        }
    } catch (error) {
        console.error('💥 Bağlantı Hatası:', error.message);
        console.log('\n💡 İpucu: Bu testi yerelde çalıştırmak için "npm run dev" ile projeyi başlatmalısın.');
        console.log('💡 Vercel üzerindeki canlı sistemi test etmek için URL\'yi güncelleyebilirsin.');
    }
}

sendTestWebhook();
