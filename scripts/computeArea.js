const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const _area = require('@turf/area').default

const {YEARS} = require('./constants')

let areas = []
YEARS.slice(4).forEach(year => computeAreas(year, areas, 'geojson'))
areas = areas.filter(row => row != null)

const changes = []
YEARS.slice(5).reverse().forEach(year => computeAreas(year, changes, 'changes'))

changes.forEach(row => {
  const lastElection = 'GE ' + YEARS[YEARS.indexOf(row.election.slice(-4)) - 1]
  const prev = areas.find(r => r.election === lastElection && r.constituency === row.prev_constituency).area
  const curr = areas.find(r => r.election === row.election && r.constituency === row.constituency).area
  row.percent_prev = row.area / prev
  row.percent_curr = row.area / curr
  row.area = row.area / 1000000
})

fs.writeFileSync('data/processed/areas.json', JSON.stringify(changes, null, 2))

const params = {
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: 'Changes!A1:H',
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: ['election', 'constituency', 'grc', 'prev_constituency', 'prev_grc', 'area', 'percent_prev', 'percent_curr'],
    data: changes
  }
}

sheets.spreadsheets.values.upload(params).catch(console.error)

function computeAreas (year, records, dir) {
  const features = require(`../data/processed/${dir}/${year}.json`).features
  features.forEach(f => {
    records[f.id] = records[f.id] || Object.assign({}, f.properties, {area: 0})
    records[f.id].area += _area(f)
  })
}
