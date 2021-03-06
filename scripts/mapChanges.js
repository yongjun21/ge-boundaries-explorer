const fs = require('fs')
const _buffer = require('@turf/buffer').default
const _intersect = require('@turf/intersect').default

const {YEARS} = require('./constants')
const {isLinearRing} = require('./helpers')

const BUFFER = 0.010

YEARS.slice(5).forEach(year => {
  const prevYear = YEARS[YEARS.indexOf(year) - 1]
  const changes = []
  let n = 0
  const curr = require(`../data/processed/geojson/${year}.json`).features
  const prev = require(`../data/processed/geojson/${prevYear}.json`).features
  const _curr = curr.map(f => _buffer(f, -BUFFER))
  const _prev = prev.map(g => _buffer(g, -BUFFER + 0.0001))
  curr.forEach((f, i) => {
    if (!_curr[i]) return
    prev.forEach((g, j) => {
      if (!_prev[j]) return
      if (
        f.properties.constituency === g.properties.constituency &&
        f.properties.grc === g.properties.grc
      ) return
      const intersection = _intersect(_curr[i], _prev[j])
      if (!intersection) return
      normGeometry(_buffer(intersection.geometry, BUFFER).geometry).forEach(geometry => {
        const feature = {
          id: n++,
          type: 'Feature',
          properties: {
            constituency: f.properties.constituency,
            grc: f.properties.grc,
            prev_constituency: g.properties.constituency,
            prev_grc: g.properties.grc
          },
          geometry
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
})

function normGeometry (geometry) {
  const geometries = []
  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(coordinates => {
      coordinates = coordinates.filter(linestring => {
        if (!isLinearRing(linestring)) linestring.push(linestring[0])
        return linestring.length >= 4
      })
      if (coordinates.length >= 1) {
        geometries.push({
          type: 'Polygon',
          coordinates
        })
      }
    })
  } else {
    const coordinates = geometry.coordinates.filter(linestring => {
      if (!isLinearRing(linestring)) linestring.push(linestring[0])
      return linestring.length >= 4
    })
    if (coordinates.length >= 1) {
      geometries.push({
        type: 'Polygon',
        coordinates
      })
    }
  }
  return geometries
}
