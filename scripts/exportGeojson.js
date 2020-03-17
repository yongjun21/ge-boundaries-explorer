const fs = require('fs')
const path = require('path')
const geojson2svg = require('./geojson2svg')

const background = require('../data/processed/geojson/2020.json').features

const grid = fs.readFileSync(path.join(__dirname, '../data/processed/grid/fill.jsonl'), 'utf-8').split('\n').map(line => JSON.parse(line))

const gridSubset = grid.filter(f => {
  const props = f.properties
  return props['GE 2020_constituency'] !== props['GE 2015_constituency'] ||
    props['GE 2020_grc'] !== props['GE 2015_grc']
}).map(f => Object.assign({}, f, {properties: {}}))

const data = background.concat(gridSubset)

const svg = geojson2svg(data, 2400, 1600, 100)

fs.writeFileSync('data/svg/2020.svg', svg)
