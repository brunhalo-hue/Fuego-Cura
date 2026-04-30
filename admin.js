const { getPedidosHoy, getClientes, updateProductoPrecio, setConfig, getPedidosPendientes } = require('../db/supabase')

const MENU = `⚙️ *Panel Admin Del Valle*\n\nComandos:\n\n📦 *pedidos* — pedidos de hoy\n⏳ *pendientes* — sin entregar\n👥 *clientes* — lista de clientes\n💰 *precio economica 5_50 62* — cambiar precio\n📏 *minimo 5* — pedido mínimo en kg\n🚪 *salir* — cerrar panel`

async function procesarAdmin(texto, from, sesionesAdmin) {
  const cmd = texto.toLowerCase().trim()

  if (cmd === (process.env.ADMIN_PASSWORD || 'delvalle2024')) return MENU
  if (cmd === 'salir') { sesionesAdmin.delete(from); return '✅ Panel cerrado.' }

  if (cmd === 'pedidos') {
    const rows = await getPedidosHoy()
    if (!rows.length) return '📦 Sin pedidos hoy.'
    return `📦 *Hoy: ${rows.length} pedidos*\n\n` + rows.map(p => `#${p.id} ${p.estado}\n${p.detalle}`).join('\n\n')
  }

  if (cmd === 'pendientes') {
    const rows = await getPedidosPendientes()
    if (!rows.length) return '✅ Sin pendientes.'
    return `⏳ *Pendientes: ${rows.length}*\n\n` + rows.map(p => `#${p.id} | ${p.telefono}\n${p.detalle}`).join('\n\n')
  }

  if (cmd === 'clientes') {
    const rows = await getClientes()
    return `👥 *${rows.length} clientes*\n\n` + rows.slice(0, 15).map(c => `${c.nombre} ${c.telefono}`).join('\n')
  }

  if (cmd.startsWith('precio ')) {
    const [, linea, rango, valor] = cmd.split(' ')
    if (!linea || !rango || !valor) return '❌ Ej: precio economica 5_50 62'
    await updateProductoPrecio(linea, `precio_${rango}`, parseFloat(valor))
    return `✅ ${linea} ${rango} = $${valor}/kg actualizado`
  }

  if (cmd.startsWith('minimo ')) {
    const kg = cmd.split(' ')[1]
    await setConfig('pedido_minimo', kg)
    return `✅ Mínimo = ${kg} kg`
  }

  return MENU
}

module.exports = { procesarAdmin }
