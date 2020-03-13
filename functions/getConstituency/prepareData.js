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

Object.keys(constituencyIndex).sort().forEach((key, i) => {
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
      constituencyBuffer[YEARS.length * i + k] = 
    }
  })
})
