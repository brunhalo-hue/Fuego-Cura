const Anthropic = require('@anthropic-ai/sdk')
const { getPedidosByCliente, guardarPedido, getProductos, getConfig } = require('../db/supabase')

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function procesarCliente(texto, cliente) {
  const pedidos   = await getPedidosByCliente(cliente.id)
  const productos = await getProductos()
  const minPedido = await getConfig('pedido_minimo') || '5'

  const catalogo = productos.map(p =>
    `- ${p.nombre} (${p.linea}): ${formatPrecios(p)}`
  ).join('\n')

  const system = `Eres el asistente de WhatsApp de *Del Valle Longaniza Artesanal*, distribuidora en CDMX/EdoMex.
Respondes en español, amigable, conciso. Usa emojis de carne 🥩 ocasionalmente. Sin asteriscos innecesarios.

CLIENTE: ${cliente.nombre} | Tel: ${cliente.telefono}
Pedidos previos: ${pedidos.length} | Último: ${pedidos[0]?.detalle || 'ninguno'}

CATÁLOGO ACTUAL:
${catalogo}

PEDIDO MÍNIMO: ${minPedido} kg

INSTRUCCIONES:
- Precios → muestra catálogo con tabla clara. Menciona descuentos por volumen.
- Pedido → recolecta: línea (Económica/Especial/Gourmet), kilogramos, dirección, turno (mañana 8-13h / tarde 14-18h), pago (efectivo/transferencia).
  Cuando tengas TODO, confirma y añade al final exactamente esto en una línea nueva:
  PEDIDO:{"linea":"X","kg":N,"dir":"X","turno":"X","pago":"X"}
- Rastreo → usa historial de pedidos. Estado: pendiente/en camino/entregado.
- Fuera de tema → redirige amablemente en máx 1 línea.
- Respuestas: máximo 6 líneas. Si el cliente escribe números sueltos (1,2,3) interprétalos como opciones del menú.`

  const resp = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 450,
    system,
    messages: [{ role: 'user', content: texto }]
  })

  const raw = resp.content[0].text

  // Detectar pedido nuevo en la respuesta
  const match = raw.match(/PEDIDO:(\{[^}]+\})/)
  if (match) {
    try {
      const datos = JSON.parse(match[1])
      const detalle = `${datos.linea} ${datos.kg}kg — ${datos.dir} — ${datos.turno} — ${datos.pago}`
      const pedido = await guardarPedido({ clienteId: cliente.id, telefono: cliente.telefono, detalle, estado: 'pendiente' })
      const textoLimpio = raw.replace(/PEDIDO:\{[^}]+\}/, '').trim()
      return { texto: textoLimpio + `\n\n📋 *Pedido #${pedido.id} registrado.* Te avisamos cuando salga a entrega.`, pedidoNuevo: true, pedidoId: pedido.id, pedidoDetalle: detalle }
    } catch (_) {}
  }

  return { texto: raw, pedidoNuevo: false }
}

function formatPrecios(p) {
  return `$${p.precio_5_50}/kg (5-50kg) | $${p.precio_51_300}/kg (51-300kg) | $${p.precio_301_600}/kg (301-600kg) | $${p.precio_601_mas}/kg (601kg+)`
}

module.exports = { procesarCliente }
