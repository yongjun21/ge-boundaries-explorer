const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const _area = require('@turf/area').default
const {nestedMap, round} = require('./helpers')

const {YEARS} = require('./constants')
const MIN_AREA = 50000

const round7 = round(7)

let uid = 0
const featureTemplates = {}

getVoters().then(voters => {
  YEARS.slice(5).forEach(year => {
    const data = require(`../data/raw/changes/${year}.json`).features
    const features = data.map(f => {
      const props = Object.assign({election: 'GE ' + year}, f.properties)
      const featureTemplate = getFeatureTemplate(props)
      if (!(voters in featureTemplate.properties)) {
        const matched = voters.find(row => (
          row.election === props.election &&
          row.constituency === props.constituency &&
          row.prev_constituency === props.prev_constituency
        ))
        featureTemplate.properties.voters = matched ? matched.voters : 0
      }
      featureTemplate.area += _area(f)
      const geometry = {
        type: 'Polygon',
        coordinates: nestedMap(f.geometry.coordinates, round7, 3)
      }
      return Object.assign({}, featureTemplate, {geometry})
    })
    const filtered = features.filter(f => f.properties.voters > 0 || f.area >= MIN_AREA)
    filtered.forEach(f => { delete f.area })
    filtered.sort((a, b) => a.id - b.id)
    fs.writeFileSync(`data/processed/changes/${year}.jsonl`, filtered.map(f => JSON.stringify(f)).join('\n'))
  })
}).catch(console.error)

function getVoters () {
  return sheets.spreadsheets.values.download({
    spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
    range: 'Voters!A1:E',
    valueRenderOption: 'UNFORMATTED_VALUE'
  }).then(res => res.data.values)
}

function getFeatureTemplate (props) {
  const key = [props.election, props.constituency, props.prev_constituency]
  if (!(key in featureTemplates)) {
    featureTemplates[key] = {
      id: uid++,
      type: 'Feature',
      properties: props,
      area: 0
    }
  }
  return featureTemplates[key]
}
