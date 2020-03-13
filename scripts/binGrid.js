const fs = require('fs')
const hextile = require('hextile')
const {sheets} = require('@st-graphics/backend/client/googleapis')

const {YEARS} = require('./constants')
const {isInsideFeature} = require('./helpers')

const features = getFeatures(YEARS)

const gridded = hextile(features, {
  shape: 'hexagon',
  center: [103.86, 1.35]
  // width: 500
})
gridded.sort((a, b) => (
  b.properties.center[1] - a.properties.center[1] ||
  a.properties.center[0] - b.properties.center[0]
))

let n = 0
const table = []
const geojson = []
gridded.forEach(grid => {
  const pt = grid.properties.center
  const row = {}
  const properties = {
    x: grid.properties.address[0],
    y: grid.properties.address[1]
  }
  features.forEach(f => {
    if (isInsideFeature(pt, f)) {
      const key = f.properties.election
      const value = f.properties.constituency + (f.properties.grc !== 'SMC' ? ' GRC' : '')
      row[key] = value
      properties[key + '_constituency'] = f.properties.constituency
      properties[key + '_grc'] = f.properties.grc
    }
  })

  if (Object.keys(row).length > 0) {
    let changed = 0
    const states = Object.values(row)
    for (let i = 1; i < states.length; i++) {
      if (states[i] !== states[i - 1]) changed++
    }
    Object.assign(row, {
      id: grid.id,
      lon: pt[0],
      lat: pt[1],
      changed
    })
    const feature = {
      id: n++,
      type: 'Feature',
      properties,
      geometry: grid.geometry
    }
    table.push(row)
    geojson.push(feature)
  }
})

// fs.writeFileSync('data/processed/grid.json', JSON.stringify(table, null, 2))
// fs.writeFileSync('data/processed/grid/fill.jsonl', geojson.map(f => JSON.stringify(f)).join('\n'))

function getFeatures (years) {
  const features = []
  years.forEach(year => {
    const file = fs.readFileSync(`data/processed/geojson/${year}.jsonl`, 'utf-8')
    const pattern = /^.+/gm
    let matched
    while ((matched = pattern.exec(file)) != null) {
      features.push(JSON.parse(matched[0]))
    }
  })
  return features
}

const params = {
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: 'Grid!A1',
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: ['id', 'lon', 'lat', 'changed', ...YEARS.map(y => 'GE ' + y)],
    data: table
  }
}

sheets.spreadsheets.values.upload(params).catch(console.error)
