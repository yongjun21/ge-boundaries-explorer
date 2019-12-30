const onemap = require('../data/onemap.json')
const geojson = require('../data/processed/geojson/2015.json')
const postalCode = require('../data/postal-code.json')

const SgHeatmap = require('sg-heatmap').default

const heatmap = new SgHeatmap(geojson.features)

Object.entries(postalCode).forEach(([key, value]) => {
  const record = onemap.find(row => row.POSTAL === key)
  if (!record) return
  const matched = heatmap.bin([+record.LONGITUDE, +record.LATITUDE])
  if (matched.length === 0) return
  const test = matched[0].properties.constituency.toUpperCase()
  if (value !== test) console.log(key, value, test)
})
