const fs = require('fs')

const {YEARS} = require('./constants')

const grouped = {}

YEARS.slice(5).forEach(group)

function group (year) {
  const base = fs.readFileSync(`data/processed/geojson/${year}.jsonl`, 'utf-8').split('\n').map(JSON.parse)
  const changes = fs.readFileSync(`data/processed/changes/${year}.jsonl`, 'utf-8').split('\n').map(JSON.parse)
  base.forEach(f => {
    if (grouped[f.id]) return
    const matched = new Set()
    changes.forEach(g => {
      if (f.properties.constituency === g.properties.constituency) matched.add(g.id)
    })
    if (matched.size > 0) grouped[f.id] = [...matched]
  })
}

fs.writeFileSync('data/processed/links.json', JSON.stringify(grouped))
