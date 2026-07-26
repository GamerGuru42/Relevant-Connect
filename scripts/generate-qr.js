const QRCode = require('qrcode')
const path = require('path')

const url = 'https://relevant-connect.vercel.app/qr'
const outputPath = path.join(__dirname, '..', 'public', 'relevant-qr-code.png')

const options = {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  quality: 1,
  margin: 2,
  color: {
    dark: '#0f172a', // Tailwind slate-900 (foreground color)
    light: '#ffffff' // White background
  },
  width: 1000
}

QRCode.toFile(outputPath, url, options, function (err) {
  if (err) throw err
  console.log('Dynamic QR code generated successfully at:', outputPath)
})
