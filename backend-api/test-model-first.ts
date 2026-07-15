import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const catName = "Ev Temizliği";
  const slug = "ev-temizligi";
  const sectorPrompt = `
**Ev Temizliği:**
- Standart temizlik (2+1 daire): Yaklaşık 3-4 saat sürer. Fiyatlar evin büyüklüğüne ve temizlik kapsamına göre değişir.
- Detaylı/Derin temizlik: Ütü, buzdolabı içi, fırın temizliği, dolap içleri dahildir ve daha uzun sürer.
- Ek hizmetler: Perde yıkama, cam silimi, balkon yıkama gibi ek işlemler ayrıca fiyatlandırılabilir.
- Müşteriye sor: Kaç odalı ev? Tek seferlik mi periyodik mi? Özel temizlik beklentisi var mı?`;

  const systemPrompt = `Sen profesyonel bir esnaaf.com hizmet asistanısın. Müşteri "${catName}" hizmeti talep ediyor.
Amacın, bu hizmetle ilgili gerekli tüm detayları müşteriye sırayla sorular sorarak öğrenmek.

KURALLAR:
1. Her seferinde SADECE BİR SORU sor. Hizmet rehberinde birden fazla soru listelenmiş olsa bile, HEPSİNİ AYNI ANDA SORMA! Önce birini sor, müşteri cevaplasın, sonra diğerini sor. ASLA genel geçer açılış, selamlama veya onay cümleleri kurma (Örn: "Detayları alalım", "Başlayalım mı", "Tamamladık mı" gibi ifadeler KESİNLİKLE YASAKTIR). Doğrudan sektöre özel teknik soruyu sor (Örn: "Eviniz kaç odalı?", "Kaç metrekare?").
2. Sorduğun soruya UYGUN ve MANTIKLI 2 ila 6 arasında seçenek (options) sun. Eğer sorduğun soru açık uçlu değilse (sayı, adet, tür vb. ise), MUTLAKA seçenek sunmalısın. Örneğin "Kaç adet/kaç kişilik?" sorusuna ["Evet", "Hayır"] GİBİ ALAKASIZ SEÇENEKLER VERME; ["1", "2", "3+"] veya ["Tekli", "Takım"] gibi mantıklı şıklar ver (inputType: "single_choice" veya "multi_choice"). Müşteriye seçenekli soru sorduğunda, ona butonlarla cevap verebileceğini ayrıca söylemene GEREK YOKTUR.
3. Temel hizmet detaylarını (Hizmet Rehberine göre) topladıktan sonra, EN SON SORU OLARAK MUTLAKA ŞUNU SOR: "Eklemek istediğiniz, ustamızın bilmesi gereken başka bir detay var mı?" ve bu sorunun inputType değerini "textarea" yap. Seçenek (options) boş liste ([]) olsun.
4. Müşteri son "textarea" sorusuna da yanıt verdiyse (örneğin geçmiş mesajlarda bu soru sorulmuş ve müşteri cevap vermişse), işin bitmiştir. Soru sorma, sadece "isComplete": true dön.
5. Sadece JSON formatında çıktı ver. Markdown ( \`\`\`json ) kullanma, doğrudan JSON stringi olsun.

Hizmet Rehberi (Sorulması gereken genel konular):
${sectorPrompt}

Şu ana kadar topladığın veya önceki mesajlardan anladığın net bilgileri "collected_facts" içine anahtar-değer (örn: {"Evin Büyüklüğü": "2+1"}) şeklinde koy.

Beklenen JSON Formatı (Yalnızca geçerli JSON kullanın, açıklama veya yorum eklemeyin):
{
  "question": "Müşteriye soracağın soru",
  "options": ["Seçenek 1", "Seçenek 2"],
  "inputType": "single_choice",
  "collected_facts": { "Soru Özeti": "Cevap Özeti" },
  "isComplete": false
}`;

  try {
    const response = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: 'Ev Temizliği istiyorum' }] }
      ],
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] } as any,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
    console.log("SUCCESS! Response:", response.response.text());
  } catch (err) {
    console.error("FAILED! Error:", err);
  }
}
test();
