const {sheets} = require('@st-graphics/backend/client/googleapis')

const data = require('../data/processed/postal-code.json')

const constituencies = {}
require('../data/processed/constituencies.json').forEach(row => {
  const key = [row.election, row.constituency]
  constituencies[key] = row
})

const {YEARS} = require('./constants')

const hdb = []

data.forEach(row => {
  if (!row.hdb) return
  const datum = {
    postal_code: row.postal_code,
    town: row.hdb.town,
    built: row.hdb.built,
    units: Object.values(row.hdb.units).reduce((sum, v) => sum + v, 0)
  }
  hdb.push(datum)
  if (!row.hdb.built) return
  datum.changed = 0
  const built = row.hdb.built.slice(0, 4)
  let i = YEARS.findIndex(y => y > built)
  if (i === -1) i = YEARS.length
  let before, after
  if (YEARS[i - 1] && row.constituencies['GE ' + YEARS[i - 1]]) {
    datum.before = row.constituencies['GE ' + YEARS[i - 1]]
    const key = ['GE ' + YEARS[i - 1], datum.before]
    before = constituencies[key].constituency_type
  }
  for (; i < YEARS.length; i++) {
    if (+YEARS[i] - +built > 7) break
    if (row.constituencies['GE ' + YEARS[i]]) {
      datum.after = row.constituencies['GE ' + YEARS[i]]
      const key = ['GE ' + YEARS[i], datum.after]
      after = constituencies[key].constituency_type
      datum.changed = (datum.before && (datum.before !== datum.after || before !== after)) ? 1 : 0
      if (datum.changed) break
    }
  }
})

sheets.spreadsheets.values.upload({
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: 'HDB!A1',
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: ['postal_code', 'town', 'built', 'units', 'before', 'after', 'changed'],
    data: hdb
  }
}).then(res => console.log(res.data)).catch(console.error)
