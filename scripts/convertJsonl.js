const fs = require('fs')

const {YEARS} = require('./constants')

YEARS.forEach(year => {
  const ld = fs.readFileSync(`data/processed/geojson/${year}.jsonl`, 'utf-8')
  const prefix = '{"type":"FeatureCollection","features":['
  const suffix = ']}'
  const json = prefix + ld.replace(/\n/g, ',') + suffix
  fs.writeFileSync(`data/processed/geojson/${year}.json`, json)
})
