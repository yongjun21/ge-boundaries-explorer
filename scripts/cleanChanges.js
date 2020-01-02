const fs = require('fs')

const {YEARS} = require('./constants')

let uid = 0
const idCache = {}

YEARS.slice(5).forEach(clean)

function clean (year) {
  const data = require(`../data/semi/changes/${year}.json`).features
  const features = data.map(f => {
    const properties = Object.assign({election: 'GE ' + year}, f.properties)
    return {
      id: getId(properties),
      type: 'Feature',
      properties,
      geometry: f.geometry
    }
  }).sort((a, b) => a.id - b.id)
  fs.writeFileSync(`data/processed/changes/${year}.jsonl`, features.map(f => JSON.stringify(f)).join('\n'))
}

function getId (prop) {
  const key = [prop.election, prop.constituency, prop.prev_constituency]
  if (!(key in idCache)) idCache[key] = uid++
  return idCache[key]
}
