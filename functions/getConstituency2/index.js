const pendingData = require('./data')

const {YEARS} = require('./constants')

const ALLOWED_ORIGINS = [
  'https://www.straitstimes.com',
  'https://qa.st-visuals.com',
  'https://dev.st-visuals.com',
  'https://remote.st-visuals.com'
]

exports.handler = async function (event) {
  const p = event.pathParameters
  const mq = event.multiValueQueryStringParameters
  const years = (mq && mq.year) || [thisYear()]
  const postal = p && p.postal

  const [names, index, coordinates, constituency] = await pendingData

  if (!(postal in index)) return {statusCode: 404}

  const i = index[postal]
  const result = {
    postal_code: postal,
    lon: coordinates[i * 2],
    lat: coordinates[i * 2 + 1]
  }
  years.forEach(year => {
    const y = YEARS.filter(y => y <= year).shift()
    if (y == null) return
    const j = YEARS.indexOf(y)
    const k = constituency[i * YEARS.length + j]
    if (k === 0) return
    result['GE ' + y] = names[k - 1]
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

function thisYear () {
  const d = new Date()
  d.setUTCHours(d.getUTCHours() + 8)
  return d.getUTCFullYear().toFixed()
}
