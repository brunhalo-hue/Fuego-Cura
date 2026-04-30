const { sendMessage } = require('../utils/whatsapp')
const { getCliente, crearCliente } = require('../db/supabase')
const { procesarCliente } = require('./claude')
const { procesarAdmin } = require('./admin')

const LISTA_BLANCA  = (process.env.LISTA_BLANCA || '').split(',').map(n => n.trim()).filter(Boolean)
const NUMERO_TIO    = process.env.NUMERO_TIO || ''
const ADMIN_PASS    = process.env.ADMIN_PASSWORD || 'delvalle2024'
const sesionesAdmin = new Set()

async function handleVerification(req, res) {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado')
    return res.status(200).send(challenge)
  }
  res.sendStatus(403)
}

async function handleMessage(req, res) {
  res.sendStatus(200)
  try {
    const value  = req.body?.entry?.[0]?.changes?.[0]?.value
    const msg    = value?.messages?.[0]
    const contac = value?.contacts?.[0]
    if (!msg || msg.type !== 'text') return

    const from  = msg.from
    const texto = msg.text.body.trim()
    const nombre = contac?.profile?.name || 'Cliente'

    console.log(`📨 [${from}] ${texto}`)

    if (LISTA_BLANCA.includes(from)) return

    if (texto === ADMIN_PASS || sesionesAdmin.has(from)) {
      if (texto === ADMIN_PASS) sesionesAdmin.add(from)
      const respAdmin = await procesarAdmin(texto, from, sesionesAdmin)
      return await sendMessage(from, respAdmin)
    }

    let cliente = await getCliente(from)
    if (!cliente) {
      cliente = await crearCliente({ telefono: from, nombre })
      return await sendMessage(from, bienvenida(nombre))
    }

    const r = await procesarCliente(texto, cliente)

    if (r.pedidoNuevo) {
      await sendMessage(NUMERO_TIO,
        `🛎️ *Pedido #${r.pedidoId}*\nCliente: ${nombre} (${from})\nDetalle: ${r.pedidoDetalle}\n\nResponde *entregado ${r.pedidoId}* cuando lo entregues.`
      )
    }

    // Rastreo: el tío escribe "entregado 12"
    if (texto.toLowerCase().startsWith('entregado ') && from === NUMERO_TIO) {
      const id = texto.split(' ')[1]
      const { actualizarEstado, getClientePorPedido } = require('../db/supabase')
      await actualizarEstado(id, 'entregado')
      const tel = await getClientePorPedido(id)
      if (tel) await sendMessage(tel, `✅ ¡Tu pedido #${id} fue entregado! Gracias por tu compra 🥩`)
      return await sendMessage(NUMERO_TIO, `✅ Pedido #${id} marcado como entregado.`)
    }

    await sendMessage(from, r.texto)
  } catch (err) {
    console.error('❌', JSON.stringify(err?.response?.data || err.message, null, 2))
  }
}

function bienvenida(nombre) {
  return `¡Hola ${nombre}! 👋 Bienvenido a *Del Valle Longaniza Artesanal* 🥩\n\nSomos distribuidores de longaniza artesanal. Puedo ayudarte con:\n\n1️⃣ Precios y líneas disponibles\n2️⃣ Hacer un pedido\n3️⃣ Rastrear tu pedido\n\n¿Qué necesitas?`
}

module.exports = { handleVerification, handleMessage }
