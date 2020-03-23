const fs = require('fs')
const path = require('path')
const geojson2svg = require('./geojson2svg')

const {YEARS} = require('./constants')

const STYLE = fs.readFileSync(path.join(__dirname, '../src/styles/svg.css'), 'utf-8')

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
    ) props[currElection + '_changed'] = 1
  })
})

grid.forEach(f => {
  const props = f.properties
  let changes = 0
  YEARS.slice(1).forEach(year => {
    if (props['GE ' + year + '_changed']) {
      changes++
      props['GE ' + year + '_cum_changes'] = changes
    }
  })
})

YEARS.slice(1).forEach(year => {
  const background = require(`../data/processed/geojson/${year}.json`).features
  const gridSubset = grid.filter(f => f.properties['GE ' + year + '_changed'])
    .map(f => Object.assign({}, f, {properties: {changes: f.properties['GE ' + year + '_cum_changes']}}))
  const svg = geojson2svg(gridSubset.concat(background), 2400, 1600, 100, bbox, undefined, 'ge-' + year, STYLE)
  fs.writeFileSync(`data/svg/changes/${year}.svg`, svg)
})
