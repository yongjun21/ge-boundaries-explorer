const fs = require('fs')

const data = fs.readFileSync('data/processed/grid.jsonl', 'utf-8').split('\n').map(JSON.parse)

const {YEARS} = require('./constants')
const ADJACENTS = [
  [-1, 1],
  [-2, -1],
  [-1, -2],
  [1, -1],
  [2, 1],
  [1, 2]
]

let n = 0

const constituencies = new Set()
data.forEach(f => {
  YEARS.forEach(year => {
    const value = f.properties['GE ' + year + '_constituency']
    if (value) constituencies.add(value)
  })
})

const outlines = []
for (const constituency of constituencies) {
  for (const year of YEARS) {
    const filtered = {}
    let segments = []
    data.forEach(f => {
      if (f.properties['GE ' + year + '_constituency'] === constituency) {
        const key = [f.properties.x, f.properties.y]
        filtered[key] = f
      }
    })

    for (const f of Object.values(filtered)) {
      ADJACENTS.forEach((offset, i) => {
        const adj = [f.properties.x + offset[0], f.properties.y + offset[1]]
        if (!filtered[adj]) {
          segments.push([f.geometry.coordinates[0][i], f.geometry.coordinates[0][i + 1]])
        }
      })
    }

    while (segments.length > 0) {
      const coordinates = segments.shift()
      const firstPoint = coordinates[0]
      let lastPoint = coordinates[1]

      while (lastPoint[0] !== firstPoint[0] || lastPoint[1] !== firstPoint[1]) {
        for (const segment of segments) {
          if (lastPoint[0] === segment[0][0] && lastPoint[1] === segment[0][1]) {
            lastPoint = segment[1]
            coordinates.push(lastPoint)
            break
          }
        }
      }

      const feature = {
        id: n++,
        type: 'Feature',
        properties: {
          election: 'GE ' + year,
          constituency
        },
        geometry: {
          type: 'LineString',
          coordinates
        }
      }

      outlines.push(JSON.stringify(feature))
      segments = segments.filter(segment => {
        return coordinates.every(pt => pt[0] !== segment[0][0] || pt[1] !== segment[0][1])
      })
    }
  }
}

fs.writeFileSync('data/processed/grid-outline.jsonl', outlines.join('\n'))
