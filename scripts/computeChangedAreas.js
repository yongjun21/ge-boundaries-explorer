const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const _area = require('@turf/area').default

const {YEARS} = require('./constants')
const MIN_AREA = 50000

let areas = {}
YEARS.slice(4).forEach(year => {
  const features = require(`../data/processed/geojson/${year}.json`).features
  features.forEach(f => {
    const key = [year, f.properties.constituency]
    areas[key] = areas[key] || Object.assign({area: 0}, f.properties)
    areas[key].area += _area(f)
  })
})
areas = Object.values(areas)

let changes = {}
YEARS.slice(5).reverse().forEach(year => {
  const features = require(`../data/raw/changes/${year}.json`).features
  features.forEach(f => {
    const key = [year, f.properties.constituency, f.properties.prev_constituency]
    changes[key] = changes[key] || Object.assign({election: 'GE ' + year, area: 0}, f.properties)
    changes[key].area += _area(f)
  })
})
changes = Object.values(changes).filter(row => row.area >= MIN_AREA)

const prevConstituency = {}
const currConstituency = {}

changes.forEach(row => {
  const lastElection = 'GE ' + YEARS[YEARS.indexOf(row.election.slice(-4)) - 1]
  const prev = areas.find(r => r.election === lastElection && r.constituency === row.prev_constituency).area
  const curr = areas.find(r => r.election === row.election && r.constituency === row.constituency).area
  row.percent_prev = row.area / prev
  row.percent_curr = row.area / curr
  row.area = row.area / 1000000

  const prevKey = [row.election, row.prev_constituency]
  prevConstituency[prevKey] = prevConstituency[prevKey] || 0
  prevConstituency[prevKey] += row.percent_prev
  const currKey = [row.election, row.constituency]
  currConstituency[currKey] = currConstituency[currKey] || 0
  currConstituency[currKey] += row.percent_curr
})

changes.forEach(row => {
  const prevKey = [row.election, row.prev_constituency]
  const currKey = [row.election, row.constituency]
  row.formation = currConstituency[currKey] > 0.95 ? 1 : 0
  row.dissolution = prevConstituency[prevKey] > 0.95 ? 1 : 0
  row.split = row.formation && row.percent_curr >= 0.9 ? 1 : 0
  row.absorbed = row.dissolution && row.percent_prev >= 0.9 ? 1 : 0
  if (row.absorbed && row.split) {
    row.absorbed = row.percent_prev > row.percent_curr ? 1 : 0
    row.split = row.percent_curr > row.percent_prev ? 1 : 0
  }
})

fs.writeFileSync('data/processed/changed_areas.json', JSON.stringify(changes, null, 2))

const params = {
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: 'Changes!A1',
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: [
      'election',
      'constituency',
      'grc',
      'prev_constituency',
      'prev_grc',
      'area',
      'percent_prev',
      'percent_curr',
      'absorbed',
      'split',
      'formation',
      'dissolution'
    ],
    data: changes
  }
}

sheets.spreadsheets.values.upload(params).then(console.log).catch(console.error)
