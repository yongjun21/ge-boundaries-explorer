const {nestedMap} = require('./helpers')

const LEVELS = {
  'MultiPolygon': 3,
  'Polygon': 2,
  'MultiLineString': 2,
  'LineString': 1
}

module.exports = function (features, width, height, padding = 0, preserveAspectRatio = 'xMidYMid meet') {
  const viewBox = `${-padding} ${-padding} ${width} ${height}`
  const pAR = preserveAspectRatio.match(/x(Min|Mid|Max)Y(Min|Mid|Max)( meet| slice)?/)
  const header = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="${preserveAspectRatio}">`
  const footer = '</svg>'
  const children = []

  const origBbox = [Infinity, Infinity, -Infinity, -Infinity]
  features.forEach(f => {
    nestedMap(f.geometry.coordinates, pt => {
      if (pt[0] < origBbox[0]) origBbox[0] = pt[0]
      if (pt[1] < origBbox[1]) origBbox[1] = pt[1]
      if (pt[0] > origBbox[2]) origBbox[2] = pt[0]
      if (pt[1] > origBbox[3]) origBbox[3] = pt[1]
    }, LEVELS[f.geometry.type])
  })

  const destBbox = [0, 0, width - 2 * padding, height - 2 * padding]
  const origAR = (origBbox[2] - origBbox[0]) / (origBbox[3] - origBbox[1])
  const destAR = destBbox[2] / destBbox[3]
  if (pAR[3] === ' slice') {
    if (destAR >= origAR) {
      const targetWidth = destBbox[3] * origAR
      destBbox[0] =
        pAR[1] === 'Min' ? 0
          : pAR[1] === 'Max' ? targetWidth - destBbox[2]
            : (targetWidth - destBbox[2]) / 2
      destBbox[2] = destBbox[0] + targetWidth
    } else {
      const targetHeight = destBbox[2] / origAR
      destBbox[1] =
        pAR[2] === 'Min' ? 0
          : pAR[2] === 'Max' ? targetHeight - destBbox[3]
            : (targetHeight - destBbox[3]) / 2
      destBbox[3] = destBbox[1] + targetHeight
    }
  } else {
    if (destAR < origAR) {
      const targetWidth = destBbox[3] * origAR
      destBbox[0] =
        pAR[1] === 'Min' ? 0
          : pAR[1] === 'Max' ? targetWidth - destBbox[2]
            : (targetWidth - destBbox[2]) / 2
      destBbox[2] = destBbox[0] + targetWidth
    } else {
      const targetHeight = destBbox[2] / origAR
      destBbox[1] =
        pAR[2] === 'Min' ? 0
          : pAR[2] === 'Max' ? targetHeight - destBbox[3]
            : (targetHeight - destBbox[3]) / 2
      destBbox[3] = destBbox[1] + targetHeight
    }
  }

  const project = getProjection([origBbox[0], origBbox[3], origBbox[2], origBbox[1]], destBbox)

  features.forEach(f => {
    if (!(f.geometry.type in LEVELS)) return
    const projected = nestedMap(f.geometry.coordinates, project, LEVELS[f.geometry.type])
    const simplified = nestedMap(projected, linestring => {
      let prev = []
      return linestring.filter(pt => {
        if (pt[0] === prev[0] && pt[1] === prev[1]) return false
        prev = pt
        return true
      })
    }, LEVELS[f.geometry.type] - 1)
    const segments = []
    nestedMap(simplified, linestring => {
      const isPolygon = f.geometry.type === 'MultiPolygon' || f.geometry.type === 'Polygon'
      if (isPolygon) {
        if (linestring.length < 4) return
        let prev = linestring[0]
        let segment = `M${prev[0]},${prev[1]}l`
        for (let i = 1; i < linestring.length - 1; i++) {
          const pt = linestring[i]
          segment += `${i > 1 ? ',' : ''}${pt[0] - prev[0]},${pt[1] - prev[1]}`
          prev = pt
        }
        segment += ' Z'
        segments.push(segment)
      } else {
        if (linestring.length < 2) return
        let prev = linestring[0]
        let segment = `M${prev[0]} ${prev[1]}l`
        for (let i = 1; i < linestring.length; i++) {
          const pt = linestring[i]
          segment += `${i > 1 ? ',' : ''}${pt[0] - prev[0]},${pt[1] - prev[1]}`
          prev = pt
        }
        segments.push(segment)
      }
    }, LEVELS[f.geometry.type] - 1)
    if (segments.length > 0) {
      const attrs = []
      if (f.id) attrs.push(`id="feature-${f.id}"`)
      attrs.push(`class="${f.geometry.type.toLowerCase()}"`)
      attrs.push(`d="${segments.join(' ')}"`)
      Object.entries(f.properties).forEach(([key, value]) => {
        attrs.push(`data-${key}="${value}"`)
      })
      children.push(`<path ${attrs.join(' ')}></path>`)
    }
  })

  return header + children.join() + footer
}

function getProjection (origBbox, destBbox) {
  return pt => {
    const tx = (pt[0] - origBbox[0]) / (origBbox[2] - origBbox[0])
    const ty = (pt[1] - origBbox[1]) / (origBbox[3] - origBbox[1])
    return [
      Math.round((1 - tx) * destBbox[0] + tx * destBbox[2]),
      Math.round((1 - ty) * destBbox[1] + ty * destBbox[3])
    ]
  }
}
