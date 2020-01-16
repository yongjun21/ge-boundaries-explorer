const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const _sortBy = require('lodash/sortBy')
const _simplify = require('@turf/clean-coords').default
const _clockwise = require('@turf/boolean-clockwise').default
const {isLinearRing, nestedMap, round} = require('./helpers')

const {YEARS} = require('./constants')

const round7 = round(7)

let uid = 0

getConstituencies().then(constituencies => {
  const recipe = {
    version: 1,
    layers: {}
  }

  YEARS.forEach(year => {
    const geojson = require(`../data/raw/geojson/${year}.json`)
    delete geojson.name
    delete geojson.crs
    geojson.features.forEach(f => {
      try {
        const description = getDescription(f.properties.KmlDescription)
        const election = 'GE ' + year
        const constituency = description['ED_DESC'].replace(' - ', '-')
        const matched = constituencies.find(row => row.election === election && row.constituencyUpper === constituency)
        f.properties = {
          election,
          constituency: matched.constituency,
          grc: matched.constituency_type === 'GRC' ? matched.mp + '-Member GRC' : 'SMC',
          voters: matched.voters,
          winner: matched.winner
        }
        f.geometry.coordinates = getCoordinates(f.geometry)
      } catch (err) {
        console.log(year, f.properties)
        throw err
      }
    })

    const features = []
    _sortBy(geojson.features, f => f.properties.constituency)
      .forEach(f => {
        const id = uid++
        if (f.geometry.type === 'MultiPolygon') {
          f.geometry.coordinates.forEach(coordinates => {
            const geometry = {type: 'Polygon', coordinates}
            features.push(Object.assign({id}, f, {geometry: _simplify(geometry, {mutate: true})}))
          })
        } else {
          const geometry = f.geometry
          features.push(Object.assign({id}, f, {geometry: _simplify(geometry, {mutate: true})}))
        }
      })

    fs.writeFileSync(`data/processed/geojson/${year}.jsonl`, features.map(f => JSON.stringify(f)).join('\n'))

    const layer = 'ge-boundaries-' + year
    recipe.layers[layer] = {
      source: 'mapbox://tileset-source/chachopazos/' + layer,
      minzoom: 10,
      maxzoom: 16
    }
  })

  fs.writeFileSync('data/recipes/base.json', JSON.stringify(recipe))
}).catch(console.error)

function getConstituencies () {
  const params = {
    spreadsheetId: '1HH5MLZu2lukbjDGMWhW_wdT7Jm0PxJN37i6EC3CaaD0',
    range: 'Constituencies!A1:M',
    valueRenderOption: 'UNFORMATTED_VALUE'
  }
  return sheets.spreadsheets.values.download(params).then(res => {
    res.data.values.forEach(row => {
      Object.keys(row).forEach(key => {
        if (row[key] == null || row[key] === '') delete row[key]
      })
      row.constituencyUpper = row.constituency.toUpperCase()
    })
    fs.writeFileSync('data/processed/constituencies.json', JSON.stringify(res.data.values))
    return res.data.values
  })
}

function getCoordinates (geometry) {
  const rounded = nestedMap(geometry.coordinates, round7, geometry.type === 'MultiPolygon' ? 4 : 3)
  const closedLoop = nestedMap(rounded, linestring => {
    if (!isLinearRing(linestring)) linestring.push(linestring[0])
    return linestring
  }, geometry.type === 'MultiPolygon' ? 2 : 1)
  return nestedMap(closedLoop, polygon => {
    polygon.forEach((linestring, i) => {
      if (i === 0 && !_clockwise(linestring)) linestring.reverse()
      else if (i > 0 && _clockwise(linestring)) linestring.reverse()
    })
    return polygon
  }, geometry.type === 'MultiPolygon' ? 1 : 0)
}

function getDescription (xml) {
  const description = {}
  const splited = xml.split('\n')
  description[splited[1].slice(4, -5)] = splited[2].slice(4, -5).trim()
  description[splited[4].slice(4, -5)] = splited[5].slice(4, -5).trim()
  return description
}
