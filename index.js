require('dotenv').config()
const express = require('express')
const { handleMessage, handleVerification } = require('./bot/handler')

const app = express()
app.use(express.json())

app.get('/webhook', handleVerification)
app.post('/webhook', handleMessage)
app.get('/', (req, res) => res.send('Del Valle Bot corriendo'))

app.listen(process.env.PORT || 3000, () => {
  console.log('🥩 Del Valle Bot activo en puerto', process.env.PORT || 3000)
})
