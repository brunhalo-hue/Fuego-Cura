const axios = require('axios')

async function sendMessage(to, body) {
  if (!to || !body) return
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      { messaging_product: 'whatsapp', to, type: 'text', text: { body } },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' } }
    )
    console.log(`✅ Mensaje enviado a ${to}`)
  } catch (err) {
    console.error(`❌ Error enviando a ${to}:`, JSON.stringify(err?.response?.data, null, 2))
  }
}

module.exports = { sendMessage }
