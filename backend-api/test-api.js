const axios = require('axios');

async function test() {
  try {
    const sessionId = 'test-koltuk-' + Date.now();
    await axios.post('https://esnaaf-backend-339090537138.europe-west3.run.app/api/ortak/chat/anonim/baslat', {}, {
      headers: { 'x-session-id': sessionId }
    });

    const res = await axios.post('https://esnaaf-backend-339090537138.europe-west3.run.app/api/musteri/chat/mesaj', {
      message: 'Koltuk Yıkama'
    }, {
      headers: { 'x-session-id': sessionId }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
