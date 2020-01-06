const {YEARS} = require('./constants')
const {isInsideFeature} = require('./helpers')

exports.handler = async function (event) {
  const q = event.queryStringParameters
  const mq = event.multiValueQueryStringParameters
  const years = (mq && mq.year) || [thisYear()]
  const lon = q && q.lon
  const lat = q && q.lat
  if (!lon || !lat) return {statusCode: 400}
  const result = {}
  years.forEach(year => {
    const y = YEARS.filter(y => y <= year).pop()
    if (y == null) return
    const constituency = getConstituency([+lon, +lat], y)
    if (constituency == null) return
    result['GE ' + y] = constituency
  })
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}

function getConstituency (lonlat, year) {
  const features = require(`./geojson/${year}.json`).features
  const matched = features.find(f => isInsideFeature(lonlat, f))
  return matched && matched.properties.constituency
}

function thisYear () {
  const d = new Date()
  d.setUTCHours(d.getUTCHours() + 8)
  return d.getUTCFullYear().toFixed()
}
