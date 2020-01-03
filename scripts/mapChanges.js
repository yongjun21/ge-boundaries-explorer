const fs = require('fs')
const _buffer = require('@turf/buffer').default
const _intersect = require('@turf/intersect').default
const _area = require('@turf/area').default
const _simplify = require('@turf/simplify').default

const {YEARS} = require('./constants')
const {isLinearRing} = require('./helpers')

const BUFFER = 0.010
const MIN_AREA = 10000

mapChanges(process.argv[2])

function mapChanges (year) {
  const prevYear = YEARS[YEARS.indexOf(year) - 1]
  const changes = []
  let n = 0
  const curr = require(`../data/processed/geojson/${year}.json`).features
  const prev = require(`../data/processed/geojson/${prevYear}.json`).features
  const _curr = curr.map(f => _buffer(f, -BUFFER))
  const _prev = prev.map(g => _buffer(g, -BUFFER))
  curr.forEach((f, i) => {
    if (!_curr[i]) return
    prev.forEach((g, j) => {
      if (!_prev[j]) return
      if (
        f.properties.constituency === g.properties.constituency &&
        (f.properties.grc === 'SMC') === (g.properties.grc === 'SMC')
      ) return
      const intersection = _intersect(_curr[i], _prev[j])
      if (!intersection) return
      normGeometry(intersection.geometry).forEach(geometry => {
        geometry = _buffer(geometry, BUFFER).geometry
        const area = _area(geometry)
        if (area < MIN_AREA) return

        const feature = {
          id: n++,
          type: 'Feature',
          properties: {
            constituency: f.properties.constituency,
            grc: f.properties.grc,
            prev_constituency: g.properties.constituency,
            prev_grc: g.properties.grc
          },
          geometry: _simplify(geometry, {tolerance: 0.0000001})
        }
        changes.push(feature)
      })
    })
  })
  const geojson = {
    type: 'FeatureCollection',
    features: changes
  }
  fs.writeFileSync(`data/raw/changes/${year}.json`, JSON.stringify(geojson))
}

function normGeometry (geometry) {
  const geometries = []
  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(coordinates => {
      coordinates = coordinates.slice(0, 1)
      if (!isLinearRing(coordinates[0])) coordinates[0].push(coordinates[0][0])
      if (coordinates[0].length >= 4) {
        geometries.push({
          type: 'Polygon',
          coordinates
        })
      }
    })
  } else {
    let coordinates = geometry.coordinates.slice(0, 1)
    if (!isLinearRing(coordinates[0])) coordinates[0].push(coordinates[0][0])
    if (coordinates[0].length >= 4) {
      geometries.push({
        type: 'Polygon',
        coordinates
      })
    }
  }
  return geometries
}