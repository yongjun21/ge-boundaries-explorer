const fs = require('fs')

const years = fs.readdirSync('data/processed/geojson')
  .filter(filename => /\.jsonl$/.test(filename))
  .map(filename => filename.slice(0, 4))

years.forEach(year => {
  const ld = fs.readFileSync(`data/processed/geojson/${year}.jsonl`, 'utf-8')
  const prefix = '{"type":"FeatureCollection","features":['
  const suffix = ']}'
  const json = prefix + ld.replace(/\n/g, ',') + suffix
  fs.writeFileSync(`data/processed/geojson/${year}.json`, json)
})
