const fs = require('fs')
const path = require('path')
const geojson2svg = require('./geojson2svg')

const {YEARS} = require('./constants')

const grid = fs.readFileSync(path.join(__dirname, '../data/processed/grid/fill.jsonl'), 'utf-8').split('\n').map(line => JSON.parse(line))

const background2020 = require(`../data/processed/geojson/2020.json`).features
const bbox = geojson2svg.getBboxFromData(background2020)

YEARS.forEach((year, i) => {
  if (i === 0) return
  const prevElection = 'GE ' + YEARS[i - 1]
  const currElection = 'GE ' + year
  grid.forEach(f => {
    const props = f.properties
    if (props[prevElection + '_constituency'] == null) return false
    if (props[currElection + '_constituency'] == null) return false
    if (
      props[currElection + '_constituency'] !== props[prevElection + '_constituency'] ||
      (props[currElection + '_grc'] === 'SMC') !== (props[prevElection + '_grc'] === 'SMC')
    ) props['changed-' + year] = 1
  })
})

grid.forEach(f => {
  const props = f.properties
  let changes = 0
  YEARS.slice(1).forEach(year => {
    if (props['changed-' + year]) {
      changes++
    }
    props['changes-' + year] = changes
  })
})

const features = []

YEARS.slice(1).forEach(year => {
  const background = require(`../data/processed/geojson/${year}.json`).features
  background.forEach(f => features.push(f))
})
grid.forEach(f => {
  const properties = {}
  Object.entries(f.properties).forEach(([key, value]) => {
    if (key.match(/^change(d|s)-/)) {
      properties[key] = value
    }
  })
  features.push(Object.assign({}, f, {properties}))
})

const svg = geojson2svg(features, 2400, 1600, 100, bbox)

fs.writeFileSync('data/svg/changes/combined.svg', svg)
