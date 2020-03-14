const fs = require('fs')
const path = require('path')

const {YEARS} = require('./constants')

const data = require('../../data/processed/postal-code.json')

const constituencyIndex = {}
data.forEach(row => {
  Object.values(row.constituencies).forEach(v => {
    constituencyIndex[v] = 0
  })
})
const constituencyNames = Object.keys(constituencyIndex).sort()
constituencyNames.forEach((key, i) => {
  constituencyIndex[key] = i + 1
})

const indexBuffer = new Uint32Array(data.length)
const coordinatesBuffer = new Float32Array(data.length * 2)
const constituencyBuffer = new Uint8Array(data.length * YEARS.length)

data.forEach((row, i) => {
  indexBuffer[i] = +row.postal_code
  coordinatesBuffer[2 * i] = row.lon
  coordinatesBuffer[2 * i + 1] = row.lat
  YEARS.forEach((year, k) => {
    const key = 'GE ' + year
    if (key in row.constituencies) {
      const constituency = row.constituencies[key]
      constituencyBuffer[YEARS.length * i + k] = constituencyIndex[constituency]
    }
  })
})

fs.writeFileSync(path.join(__dirname, 'data/index.buf'), indexBuffer)
fs.writeFileSync(path.join(__dirname, 'data/coordinates.buf'), coordinatesBuffer)
fs.writeFileSync(path.join(__dirname, 'data/constituency.buf'), constituencyBuffer)
fs.writeFileSync(path.join(__dirname, 'data/names.json'), JSON.stringify(constituencyNames))
