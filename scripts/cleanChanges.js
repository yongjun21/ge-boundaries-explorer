const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const {nestedMap, round} = require('./helpers')

const {YEARS} = require('./constants')

let uid = 0
const idCache = {}

getMeta().then(data => {
  const changes = {}
  data.forEach(row => {
    const key = [row.election, row.constituency, row.prev_constituency]
    changes[key] = row
  })
  YEARS.slice(5).forEach(year => {
    const round7 = round(7)
    const data = require(`../data/raw/changes/${year}.json`).features
    const features = []
    data.forEach(f => {
      const props = Object.assign({election: 'GE ' + year}, f.properties)
      const changeKey = [props.election, props.constituency, props.prev_constituency]
      if (!(changeKey in changes)) return
      Object.assign(props, changes[changeKey])
      f.geometry.coordinates = nestedMap(f.geometry.coordinates, round7, 3)
      features.push({
        id: getId(props),
        type: 'Feature',
        properties: props,
        geometry: f.geometry
      })
    })
    features.sort((a, b) => a.id - b.id)
    fs.writeFileSync(`data/processed/changes/${year}.jsonl`, features.map(f => JSON.stringify(f)).join('\n'))
  })
}).catch(console.error)

function getMeta () {
  return sheets.spreadsheets.values.download({
    spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
    range: 'Changes!A1:L',
    valueRenderOption: 'UNFORMATTED_VALUE'
  }).then(res => res.data.values)
}

function getId (props) {
  const key = [props.election, props.constituency, props.prev_constituency]
  if (!(key in idCache)) idCache[key] = uid++
  return idCache[key]
}
