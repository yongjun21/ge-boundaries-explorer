<template>
  <div class="buildings-map">
    <!-- <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search> -->
    <!-- <div class="legend" ref="legend"></div> -->
    <input class="control" type="range" min="0" max="7" step="1" v-model="activeLayerIndex" />
    <h1 class="map-title">GE {{activeLayer}} Boundaries</h1>
  </div>
</template>

<script>
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import TooltipContent from './TooltipContent'

const AREAS = {
  BEDOK: {
    center: [103.92840945179253, 1.3240468743758742],
    zoom: 13
  },
  SERANGOON: {
    center: [103.86781807199124, 1.3652014832788346],
    zoom: 13
  }
}

const COLORS = {
  red: 'rgba(255,0,0,0.6)',
  blue: 'rgba(0,0,255,0.6)',
  green: 'rgba(0,128,0,0.6)',
  orange: 'rgba(255,128,0,0.6)',
  purple: 'rgba(255,0,255,0.6)',
  black: 'rgba(0,0,0,0.6)'
}

const COLOR_SCHEME = {
  BEDOK: [
    'East Coast', COLORS.red,
    'Bedok', COLORS.red,
    'Tanah Merah', COLORS.red,
    'Siglap', COLORS.red,
    'Changi', COLORS.red,
    'Kampong Chai Chee', COLORS.red,
    'Marine Parade', COLORS.blue,
    'Geylang Serai', COLORS.blue,
    'Aljunied', COLORS.green,
    'Paya Lebar', COLORS.green,
    'Eunos', COLORS.green,
    'Tampines', COLORS.orange,
    'Changkat', COLORS.orange
  ],
  SERANGOON: [
    'Aljunied', COLORS.green,
    'Hougang', COLORS.green,
    // 'Serangoon Gardens', COLORS.green,
    'Paya Lebar', COLORS.green,
    'Ang Mo Kio', COLORS.red,
    'Yio Chu Kang', COLORS.red,
    'Teck Ghee', COLORS.red,
    'Kebun Baru', COLORS.red,
    'Pasir Ris-Punggol', COLORS.blue,
    'Pasir Ris', COLORS.blue,
    'Punggol', COLORS.blue,
    'Eunos', COLORS.blue,
    'Cheng San', COLORS.purple,
    'Marine Parade', COLORS.orange,
    // 'Braddell Heights', COLORS.orange,
    'Bishan-Toa Payoh', COLORS.black,
    'Toa Payoh', COLORS.black,
    'Thomson', COLORS.black,
    'Kim Keat', COLORS.black
  ]
}

const YEARS = ['1988', '1991', '1997', '2001', '2006', '2011', '2015', '2020']

export default {
  name: 'BuildingsMap',
  // components: {
  //   OnemapSearch
  // },
  inject: ['additionalInfo'],
  data () {
    return {
      activeLayerIndex_: 0
    }
  },
  computed: {
    activeLayerIndex: {
      get () {
        return this.activeLayerIndex_.toString()
      },
      set (value) {
        this.activeLayerIndex_ = +value
      }
    },
    activeLayer () {
      return YEARS[YEARS.length - this.activeLayerIndex_ - 1]
    }
  },
  methods: {
    startAnimating () {
      this.animating = setTimeout(() => {
        this.activeLayerIndex_ = this.activeLayerIndex_ === 0 ? YEARS.length - 1 : this.activeLayerIndex_ - 1
        this.startAnimating()
      }, 1500)
    }
  },
  mounted () {
    const area = this.$route.params.area.toUpperCase()
    const map = new mapboxgl.Map(Object.assign({
      container: this.$el,
      style: 'mapbox://styles/yongjun21/ckd5mel1y0r3t1is4tkv0ye89',
      minZoom: 10,
      maxZoom: 16,
      maxBounds: [[103.42295489648154, 1.0774867904165433], [104.21671710351262, 1.6266481512753188]],
      scrollZoom: true,
      dragPan: true,
      dragRotate: false,
      accessToken: 'pk.eyJ1IjoieW9uZ2p1bjIxIiwiYSI6ImNpdTY5c2tyZzBqaDgyemxwYjk0Nnlic2UifQ.A5OHCYPcLTupbo1Qi3t5OQ'
    }, AREAS[area]))
    map.touchZoomRotate.disableRotation()

    const nav = new mapboxgl.NavigationControl({showCompass: false})
    map.addControl(nav, 'top-left')

    const tooltip = createPopup(TooltipContent, {
      closeButton: false,
      closeOnClick: false,
      anchor: 'center'
    })

    map.on('load', () => {
      map.addSource('ge-boundaries-buildings', {
        type: 'vector',
        url: 'mapbox://yongjun21.ge-boundaries-buildings'
      })

      map.addSource('ura_planning_areas', {
        type: 'vector',
        url: 'mapbox://yongjun21.ura_planning_areas'
      })

      map.addLayer({
        id: 'base_fill',
        source: 'ura_planning_areas',
        'source-layer': 'ura_planning_areas',
        type: 'fill',
        paint: {
          'fill-color': 'transparent'
        }
      })

      YEARS.forEach(year => {
        map.addLayer({
          id: 'fill_' + year,
          source: 'ge-boundaries-buildings',
          'source-layer': 'ge-boundaries-buildings',
          type: 'fill',
          paint: {
            'fill-color': ['match',
              ['get', 'GE ' + year],
              ...COLOR_SCHEME[area],
              'rgba(128,128,128,0.6)'
            ],
            'fill-opacity': this.activeLayer === year ? 1 : 0,
            'fill-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })
      })

      map.addLayer({
        id: 'base_outline',
        source: 'ura_planning_areas',
        'source-layer': 'ura_planning_areas',
        type: 'line',
        paint: {
          'line-color': 'black',
          'line-width': 2.4,
          'line-opacity': 1
        }
      })

      this.$watch('activeLayer', (currLayer, prevLayer) => {
        map.setPaintProperty('fill_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('fill_' + currLayer, 'fill-opacity', 1)
      })

      this.startAnimating()

      map.on('mousemove', e => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['fill_' + this.activeLayer, 'base_fill']
        })
        if (features.length > 0) {
          const key = 'GE ' + this.activeLayer
          if (!features[0].properties[key]) return
          tooltip.setData(features[0].properties[key]).trackPointer().addTo(map)
        } else {
          tooltip.setData(null).remove()
        }
      })
    })
  }
}

function createPopup (Content, options) {
  const popup = new mapboxgl.Popup(options)
  const $el = document.createElement('div')
  const vm = new Vue(Content)
  popup.setDOMContent($el)
  vm.$mount($el)
  popup.setData = function (data) {
    vm.data = Object.freeze(data)
    return this
  }
  popup.on = function (event, callback) {
    vm.$on(event, callback)
    return this
  }
  return popup
}
</script>

<style lang="scss">
@import '../styles/input-range.scss';

$font-CuratorRegular: 'CuratorRegular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
$font-CuratorBold: 'CuratorBold', 'Helvetica Neue', Helvetica, Arial, sans-serif;

.buildings-map {
  width: 100%;
  height: 800px;

  .onemap-search {
    display: block;
    position: absolute;
    z-index: 1;
    top: 20px;
    right: 20px;
  }

  .tooltip {
    position: absolute;
  }

  .legend {
    width: 240px;
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1;
  }

  .mapboxgl-popup-content {
    padding: 3px 8px;
    font-family: $font-CuratorRegular;
  }

  .mapboxgl-control-container {
    .mapboxgl-ctrl-bottom-left,
    .mapboxgl-ctrl-bottom-right {
      display: none;
    }
  }

  .control {
    position: absolute;
    z-index: 1;
    width: 500px;
    height: 16px;
    margin: -36px 0 0 150px;
    transform: rotate(90deg);
    transform-origin: -150px 36px;
    border-radius: 8px;
  }

  .map-title {
    position: absolute;
    z-index: 1;
    left: 100px;
    top: 8px;
    font-size: 36px;
    color: #0C2B57;
    font-family: $font-CuratorBold;
  }
}
</style>
