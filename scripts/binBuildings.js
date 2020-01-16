const fs = require('fs')
const _centroid = require('@turf/centroid').default

const {YEARS} = require('./constants')
const {isInsideFeature} = require('./helpers')

const buildings = fs.readFileSync('data/raw/buildings.jsonl', 'utf-8')
  .split('\n').map(JSON.parse)

const centroids = buildings.map(f => _centroid(f).geometry.coordinates)

YEARS.forEach(year => {
  const constituencies = require(`../data/processed/geojson/${year}.json`).features
  centroids.forEach((pt, i) => {
    const matched = constituencies.find(f => isInsideFeature(pt, f))
    if (matched) {
      buildings[i].properties['GE ' + year] = matched.properties.constituency
    }
  })
  console.log(year)
})

fs.writeFileSync('data/processed/buildings.jsonl', buildings.map(f => JSON.stringify(f)).join('\n'))
