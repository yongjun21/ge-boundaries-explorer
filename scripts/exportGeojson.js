const fs = require('fs')
const path = require('path')
const geojson2svg = require('./geojson2svg')

const {YEARS} = require('./constants')

const grid = fs.readFileSync(path.join(__dirname, '../data/processed/grid/fill.jsonl'), 'utf-8').split('\n').map(line => JSON.parse(line))

const background2020 = require(`../data/processed/geojson/2020.json`).features
const bbox = geojson2svg.getBboxFromData(background2020)

for (let i = 1; i < YEARS.length; i++) {
  const prevElection = 'GE ' + YEARS[i - 1]
  const currElection = 'GE ' + YEARS[i]
  grid.forEach(f => {
    const props = f.properties
    if (props[prevElection + '_constituency'] == null) return false
    if (props[currElection + '_constituency'] == null) return false
    if (
      props[currElection + '_constituency'] !== props[prevElection + '_constituency'] ||
      (props[currElection + '_grc'] === 'SMC') !== (props[prevElection + '_grc'] === 'SMC')
    ) props[currElection + '_changed'] = 1
  })
}

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
  const svg = geojson2svg(background.concat(gridSubset), 2400, 1600, 100, bbox)
  fs.writeFileSync(`data/svg/changes/${year}.svg`, svg)
})
