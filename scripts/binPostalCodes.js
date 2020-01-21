const fs = require('fs')

const {YEARS} = require('./constants')
const {isInsideFeature} = require('./helpers')

const onemap = require('../data/onemap.json')

const hdbUnits = {}
fs.readFileSync('data/hdb_units.csv', 'utf-8')
  .replace(/"/g, '')
  .split('\r\n')
  .slice(1)
  .forEach(line => {
    const [code, type, count] = line.split(',')
    hdbUnits[code] = hdbUnits[code] || {}
    hdbUnits[code][type] = +count
  })

const privateProps = {}
fs.readFileSync('data/private_properties.csv', 'utf-8')
  .replace(/"/g, '')
  .split('\r\n')
  .slice(1)
  .forEach(line => {
    const [street, project, type] = line.split(',')
    const key = [street, project]
    privateProps[key] = type
  })

const data = {}
onemap.forEach((row, i) => {
  if (i % 1000 === 0) console.log(i)
  if (row.POSTAL === 'NIL') return
  if (row.POSTAL in data) return
  if (row.BUILDING && /^(DBS|OCBC|UOB)/.test(row.BUILDING)) return
  const pt = [+row.LONGITUDE, +row.LATITUDE]
  const matchedConstituencies = {}
  YEARS.forEach(year => {
    const constituencies = require(`../data/processed/geojson/${year}.json`).features
    const matched = constituencies.find(f => isInsideFeature(pt, f))
    if (matched) {
      matchedConstituencies['GE ' + year] = matched.properties.constituency
    }
  })
  data[row.POSTAL] = {
    postal_code: row.POSTAL,
    lon: +row.LONGITUDE,
    lat: +row.LATITUDE,
    block: row.BLK_NO,
    street: row.ROAD_NAME,
    project: row.BUILDING,
    constituencies: matchedConstituencies,
    hdb_units: hdbUnits[row.POSTAL],
    private: privateProps[[row.ROAD_NAME, row.BUILDING]]
  }
})

fs.writeFileSync('data/processed/postal-code.json', JSON.stringify(Object.values(data), null, 2))
