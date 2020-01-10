const fs = require('fs')
const {sheets} = require('@st-graphics/backend/client/googleapis')
const _area = require('@turf/area').default

const {YEARS} = require('./constants')
const MIN_AREA = 50000

const areas = getAreas()
const changes = compileChanges()

getVoters().then(([voters, prevTotal, currTotal]) => {
  changes.forEach(row => {
    const currElection = row.election
    const prevElection = 'GE ' + YEARS[YEARS.indexOf(row.election.slice(-4)) - 1]
    const currConstituency = row.constituency + (row.grc === 'SMC' ? '' : ' GRC')
    const prevConstituency = row.prev_constituency + (row.prev_grc === 'SMC' ? '' : ' GRC')
    row.percent_prev = row.area / areas[prevElection][prevConstituency]
    row.percent_curr = row.area / areas[currElection][currConstituency]
    row.area = row.area / 1000000
    row.voters = (voters[currElection][row.constituency] || {})[row.prev_constituency] || 0
    row.formation = currConstituency in areas[prevElection] ? 0 : 1
    row.dissolution = prevConstituency in areas[currElection] ? 0 : 1
    row.net_effect = 0
    if (row.voters === 0) return
    if (row.formation) {
      row.net_effect += row.voters / currTotal[currElection][row.constituency]
    }
    if (row.dissolution) {
      row.net_effect -= row.voters / prevTotal[currElection][row.prev_constituency]
    }
  })

  saveData(changes)
})

function getVoters () {
  return sheets.spreadsheets.values.download({
    spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
    range: 'Voters!A1:E',
    valueRenderOption: 'UNFORMATTED_VALUE'
  }).then(res => res.data.values).then(data => {
    const voters = {}
    const prevTotal = {}
    const currTotal = {}
    YEARS.slice(5).forEach(year => {
      voters['GE ' + year] = {}
      prevTotal['GE ' + year] = {}
      currTotal['GE ' + year] = {}
    })
    data.forEach(row => {
      voters[row.election][row.constituency] = voters[row.election][row.constituency] || {}
      voters[row.election][row.constituency][row.prev_constituency] = row.est_voters
      currTotal[row.election][row.constituency] = currTotal[row.election][row.constituency] || 0
      currTotal[row.election][row.constituency] += row.est_voters
      prevTotal[row.election][row.prev_constituency] = prevTotal[row.election][row.prev_constituency] || 0
      prevTotal[row.election][row.prev_constituency] += row.est_voters
    })
    return [voters, prevTotal, currTotal]
  })
}

function getAreas () {
  const areas = {}
  YEARS.slice(4).forEach(year => {
    const election = 'GE ' + year
    areas[election] = {}
    const features = require(`../data/processed/geojson/${year}.json`).features
    features.forEach(f => {
      const constituency = f.properties.constituency + (f.properties.grc === 'SMC' ? '' : ' GRC')
      areas[election][constituency] = areas[election][constituency] || 0
      areas[election][constituency] += _area(f)
    })
  })
  return areas
}

function compileChanges () {
  let changes = {}
  YEARS.slice(5).reverse().forEach(year => {
    const features = require(`../data/raw/changes/${year}.json`).features
    features.forEach(f => {
      const key = [year, f.properties.constituency, f.properties.prev_constituency]
      changes[key] = changes[key] || Object.assign({election: 'GE ' + year}, f.properties, {area: 0})
      changes[key].area += _area(f)
    })
  })
  return Object.values(changes).filter(row => row.area >= MIN_AREA)
}

function saveData (data) {
  fs.writeFileSync('data/processed/changed_areas.json', JSON.stringify(data, null, 2))

  const params = {
    spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
    range: 'Changes!A1',
    valueInputOption: 'USER_ENTERED',
    resource: {
      fields: [
        'election',
        'constituency',
        'grc',
        'prev_constituency',
        'prev_grc',
        'area',
        'voters',
        'percent_prev',
        'percent_curr',
        'formation',
        'dissolution',
        'net_effect'
      ],
      data
    }
  }

  sheets.spreadsheets.values.upload(params)
    .then(res => console.log(res.data))
    .catch(console.error)
}
