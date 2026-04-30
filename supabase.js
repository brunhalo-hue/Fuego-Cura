const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const getCliente = async (tel) => {
  const { data } = await sb.from('clientes').select('*').eq('telefono', tel).single()
  return data
}
const crearCliente = async ({ telefono, nombre }) => {
  const { data } = await sb.from('clientes').insert([{ telefono, nombre }]).select().single()
  return data
}
const getClientes = async () => {
  const { data } = await sb.from('clientes').select('*').order('created_at', { ascending: false })
  return data || []
}
const guardarPedido = async ({ clienteId, telefono, detalle, estado = 'pendiente' }) => {
  const { data } = await sb.from('pedidos').insert([{ cliente_id: clienteId, telefono, detalle, estado }]).select().single()
  return data
}
const getPedidosByCliente = async (clienteId) => {
  const { data } = await sb.from('pedidos').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }).limit(5)
  return data || []
}
const getPedidosHoy = async () => {
  const hoy = new Date().toISOString().split('T')[0]
  const { data } = await sb.from('pedidos').select('*').gte('created_at', hoy).order('created_at', { ascending: false })
  return data || []
}
const getPedidosPendientes = async () => {
  const { data } = await sb.from('pedidos').select('*').eq('estado', 'pendiente').order('created_at', { ascending: true })
  return data || []
}
const actualizarEstado = async (id, estado) => {
  await sb.from('pedidos').update({ estado }).eq('id', id)
}
const getClientePorPedido = async (id) => {
  const { data } = await sb.from('pedidos').select('telefono').eq('id', id).single()
  return data?.telefono
}
const getProductos = async () => {
  const { data } = await sb.from('productos').select('*').eq('activo', true).order('orden')
  return data || []
}
const updateProductoPrecio = async (linea, campo, valor) => {
  await sb.from('productos').update({ [campo]: valor }).ilike('linea', linea)
}
const getConfig = async (clave) => {
  const { data } = await sb.from('config').select('valor').eq('clave', clave).single()
  return data?.valor
}
const setConfig = async (clave, valor) => {
  await sb.from('config').upsert([{ clave, valor }], { onConflict: 'clave' })
}

module.exports = {
  getCliente, crearCliente, getClientes,
  guardarPedido, getPedidosByCliente, getPedidosHoy, getPedidosPendientes,
  actualizarEstado, getClientePorPedido,
  getProductos, updateProductoPrecio,
  getConfig, setConfig
}
