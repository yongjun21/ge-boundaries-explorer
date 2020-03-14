const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
fs.readFile = promisify(fs.readFile)

module.exports = Promise.all([
  require('./data/names.json'),
  fs.readFile(path.join(__dirname, 'data/index.buf')),
  fs.readFile(path.join(__dirname, 'data/coordinates.buf')),
  fs.readFile(path.join(__dirname, 'data/constituency.buf'))
]).then(([names, indexBuf, coordinatesBuf, constituencyBuf]) => {
  const indexArr = new Uint32Array(indexBuf.buffer)
  const coordinates = new Float32Array(coordinatesBuf.buffer)
  const constituency = new Uint8Array(constituencyBuf.buffer)

  const index = {}
  indexArr.forEach((v, i) => {
    const key = v.toFixed().padStart(6, '0')
    index[key] = i
  })
  return [names, index, coordinates, constituency]
})
