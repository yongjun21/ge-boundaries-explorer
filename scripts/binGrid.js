const fs = require('fs')
const hextile = require('hextile')
const {sheets} = require('@st-graphics/backend/client/googleapis')

const {isInsideFeature} = require('./helpers')

const binned = {}

const years = fs.readdirSync('data/processed/geojson')
  .filter(filename => /\.jsonl$/.test(filename))
  .map(filename => filename.slice(0, 4))
  .slice(0, 12)

years.forEach(year => {
  binGrid(year)
})

Object.values(binned).forEach(row => {
  let changed = 0
  let curr
  const states = []
  Object.keys(row).forEach(key => {
    if (['id', 'lon', 'lat'].includes(key)) return
    states.push(row[key])
  })
  curr = states[0]
  for (let i = 1; i < states.length; i++) {
    if (states[i] !== curr) {
      changed++
      curr = states[i]
    }
  }
  row.changed = changed
})

fs.writeFileSync('data/processed/grid.json', JSON.stringify(Object.values(binned), null, 2))

const params = {
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: 'Grid!A1:P',
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: ['id', 'lon', 'lat', 'changed', ...years.map(y => 'GE ' + y)],
    data: Object.values(binned)
  }
}

sheets.spreadsheets.values.upload(params).catch(console.error)

function binGrid (year) {
  const features = fs.readFileSync(`data/processed/geojson/${year}.jsonl`, 'utf-8')
    .split('\n')
    .map(JSON.parse)

  const gridded = hextile(features, {
    shape: 'hexagon',
    center: [103.86, 1.35]
  })

  gridded.forEach(grid => {
    const pt = grid.properties.center
    const matched = features.find(f => isInsideFeature(pt, f))
    if (matched) {
      binned[grid.id] = binned[grid.id] || {
        id: grid.id,
        lon: pt[0],
        lat: pt[1]
      }
      binned[grid.id][matched.properties.election] = matched.properties.constituency
    }
  })
}
