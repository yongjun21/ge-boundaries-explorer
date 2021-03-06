const {sheets} = require('@st-graphics/backend/client/googleapis')

const data = require('../data/processed/postal-code.json')

const flattened = []

data.forEach(datum => {
  if (!datum.private && !datum.hdb) return
  if (datum.hdb && Object.keys(datum.hdb.units).length === 0) return
  if (!datum.constituencies['GE 2015']) return
  const row = {
    postal_code: datum.postal_code,
    constituency: datum.constituencies['GE 2020'],
    is_landed: datum.private === 'Landed' ? 1 : 0,
    is_non_landed: datum.private === 'Non-landed' ? 1 : 0,
    is_hdb: datum.hdb ? 1 : 0,
    hdb_2_room: 0,
    hdb_3_room: 0,
    hdb_4_room: 0,
    hdb_5_room: 0
  }
  if (datum.hdb) {
    row.hdb_2_room += datum.hdb.units['STUDIO APARTMENT'] || 0
    row.hdb_2_room += datum.hdb.units['1-ROOM'] || 0
    row.hdb_2_room += datum.hdb.units['2-ROOM'] || 0
    row.hdb_3_room += datum.hdb.units['3-ROOM'] || 0
    row.hdb_4_room += datum.hdb.units['4-ROOM'] || 0
    row.hdb_5_room += datum.hdb.units['5-ROOM'] || 0
    row.hdb_5_room += datum.hdb.units['MULTI-GENERATION'] || 0
    row.hdb_5_room += datum.hdb.units['EXECUTIVE'] || 0
    row.hdb_4_room += datum.hdb.units['TYPE S1'] || 0
    row.hdb_5_room += datum.hdb.units['TYPE S2'] || 0
    row.hdb_5_room += datum.hdb.units['HUDC'] || 0
  }
  flattened.push(row)
})

sheets.spreadsheets.values.upload({
  spreadsheetId: '1K-ph37IQl_j0yAAa8MU8ahvY0DqABS7ECLKs1hNMw8o',
  range: "'Postal code'!A1",
  valueInputOption: 'USER_ENTERED',
  resource: {
    fields: ['postal_code', 'constituency', 'is_landed', 'is_non_landed', 'is_hdb', 'hdb_2_room', 'hdb_3_room', 'hdb_4_room', 'hdb_5_room'],
    data: flattened
  }
}).then(res => console.log(res.data)).catch(console.error)
