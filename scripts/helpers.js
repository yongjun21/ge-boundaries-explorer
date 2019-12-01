exports.promiseMap = function (iterable, mapper, options) {
  options = options || {}
  let concurrency = options.concurrency || Infinity

  let index = 0
  const results = []
  const iterator = iterable[Symbol.iterator]()
  const promises = []

  while (concurrency-- > 0) {
    const promise = wrappedMapper()
    if (promise) promises.push(promise)
    else break
  }

  return Promise.all(promises).then(() => results)

  function wrappedMapper () {
    const next = iterator.next()
    if (next.done) return null
    const i = index++
    const mapped = mapper(next.value, i)
    return Promise.resolve(mapped).then(resolved => {
      results[i] = resolved
      return wrappedMapper()
    })
  }
}

exports.nestedMap = function nestedMap (arr, fn, levels = 1) {
  if (levels === 0) return fn(arr)
  return arr.map(v => nestedMap(v, fn, levels - 1))
}

exports.isLinearRing = function (linestring) {
  const first = linestring[0]
  const last = linestring[linestring.length - 1]
  return first[0] === last[0] && first[1] === last[1]
}

exports.round = function (dp) {
  const f = Math.pow(10, dp)
  return v => Math.round(v * f) / f
}

exports.isInsideFeature = function (pt, f) {
  const {type, coordinates} = f.geometry
  if (type === 'Polygon') return isInsidePolygon(pt, coordinates)
  else if (type === 'MultiPolygon') return coordinates.some(polygon => isInsidePolygon(pt, polygon))
  else return false
}

function isInsidePolygon (pt, polygon) {
  const [outer, ...inners] = polygon
  return isInside(pt, outer) && !inners.some(inner => isInside(pt, inner))
}

function isInside ([lng, lat], linearRing) {
  const bbox = getBbox(linearRing)
  if (lng < bbox[0] || lng > bbox[2]) return false
  if (lat < bbox[1] || lat > bbox[3]) return false
  let isInside = false
  for (let i = 1; i < linearRing.length; i++) {
    const deltaYplus = linearRing[i][1] - lat
    const deltaYminus = lat - linearRing[i - 1][1]
    if (deltaYplus > 0 && deltaYminus <= 0) continue
    if (deltaYplus < 0 && deltaYminus >= 0) continue
    const deltaX = (deltaYplus * linearRing[i - 1][0] + deltaYminus * linearRing[i][0]) /
      (deltaYplus + deltaYminus) - lng
    if (deltaX <= 0) continue
    isInside = !isInside
  }
  return isInside
}

const bboxes = new WeakMap()

function getBbox (linearRing) {
  if (bboxes.has(linearRing)) return bboxes.get(linearRing)
  const bbox = [
    linearRing.reduce((min, pt) => pt[0] < min[0] ? pt : min)[0],
    linearRing.reduce((min, pt) => pt[1] < min[1] ? pt : min)[1],
    linearRing.reduce((max, pt) => pt[0] > max[0] ? pt : max)[0],
    linearRing.reduce((max, pt) => pt[1] > max[1] ? pt : max)[1]
  ]
  bboxes.set(linearRing, bbox)
  return bbox
}
