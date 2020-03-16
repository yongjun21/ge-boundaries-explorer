const fs = require('fs')
const geojson2svg = require('./geojson2svg')

const data = require('../data/processed/geojson/2020.json').features

const svg = geojson2svg(data, 2400, 1600, 100)

fs.writeFileSync('data/svg/2020.svg', svg)
