const fs = require('fs')
const {promiseMap} = require('./helpers')

const AWS = require('aws-sdk')
const credentials = new AWS.SharedIniFileCredentials({profile: 'st-graphics'})
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'ap-southeast-1',
  credentials
})

promiseMap(_range(0, 1000000, 500), retrieve, {concurrency: 50}).then(results => {
  const compiled = {}
  results.forEach(batch => {
    batch.forEach(row => {
      compiled[row.code] = row.curr
      if (row.prev !== 'There is no change from your previous electoral division.') {
        console.log(row.code, row.prev)
      }
    })
  })
  fs.writeFileSync('data/postal-code.json', JSON.stringify(compiled, null, 2))
})

function retrieve (start) {
  const key = 'eld/' + start.toFixed().padStart(6, '0') + '.json'
  return s3.getObject({
    Bucket: 'st-graphics-dev-json',
    Key: key
  }).promise().then(data => JSON.parse(data.Body.toString()))
}

function _range (start, end, step = 1) {
  const arr = []
  if (step > 0) {
    for (let i = start; i < end; i += step) arr.push(i)
  } else {
    for (let i = start; i > end; i += step) arr.push(i)
  }
  return arr
}
