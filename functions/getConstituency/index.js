const {YEARS} = require('./constants')
const {isInsideFeature} = require('./helpers')

const ALLOWED_ORIGINS = [
  'https://www.straitstimes.com',
  'https://qa.st-visuals.com',
  'https://dev.st-visuals.com',
  'https://remote.st-visuals.com'
]

exports.handler = async function (event) {
  const q = event.queryStringParameters
  const mq = event.multiValueQueryStringParameters
  const years = (mq && mq.year) || [thisYear()]
  const lon = q && q.lon
  const lat = q && q.lat
  if (!lon || !lat) return {statusCode: 400}
  const result = {lon, lat}
  years.forEach(year => {
    const y = YEARS.filter(y => y <= year).pop()
    if (y == null) return
    const constituency = getConstituency([+lon, +lat], y)
    if (constituency == null) return
    result['GE ' + y] = constituency
  })

  const headers = {
    'Cache-Control': 'public, max-age=86400, must-revalidate'
  }
  if (process.env.NODE_ENV === 'production') {
    const origin = event.headers && (event.headers.origin || event.headers.Origin)
    if (ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
    else headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
    headers['Vary'] = 'Origin'
  } else {
    headers['Access-Control-Allow-Origin'] = '*'
  }

  return {
    statusCode: 200,
    headers,
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
