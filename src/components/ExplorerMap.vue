<template>
  <div class="explorer-map">
    <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search>
    <div class="legend" ref="legend"></div>
    <input class="control" type="range" min="0" max="11" step="1" v-model="activeLayerIndex" />
    <h1 class="map-title">GE {{activeLayer}} Boundaries</h1>
  </div>
</template>

<script>
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import OnemapSearch from './OnemapSearch'
import PopoverContent from './PopoverContent'
import TooltipContent from './TooltipContent'

const SINGAPORE = {
  center: [103.819836, 1.352083],
  zoom: 11
}

const YEARS = ['1968', '1972', '1976', '1980', '1984', '1988', '1991', '1997', '2001', '2006', '2011', '2015']

export default {
  name: 'ExplorerMap',
  components: {
    OnemapSearch
  },
  inject: ['additionalInfo'],
  data () {
    const year = this.$route.query.year || '2015'
    const index = YEARS.filter(y => year < y).length
    return {
      activeLayerIndex: Math.min(index, YEARS.length - 1)
    }
  },
  computed: {
    activeLayer () {
      return YEARS[YEARS.length - this.activeLayerIndex - 1]
    }
  },
  watch: {
    activeLayer: {
      handler (year) {
        this.$router.replace(this.$route.path + '?year=' + year)
      },
      immediate: true
    }
  },
  mounted () {
    const map = new mapboxgl.Map(Object.assign({
      container: this.$el,
      style: 'mapbox://styles/chachopazos/ck3fc0qpp0fyd1ct5ai5owqu0',
      minZoom: 10,
      maxZoom: 16,
      maxBounds: [[103.42295489648154, 1.0774867904165433], [104.21671710351262, 1.6266481512753188]],
      scrollZoom: true,
      dragPan: true,
      dragRotate: false,
      accessToken: 'pk.eyJ1IjoiY2hhY2hvcGF6b3MiLCJhIjoiY2pkMDN3eW4wNHkwZDJ5bGc0cnpueGNxbCJ9.WWWg_OnK5e7L1RknMliY4A'
    }, SINGAPORE))
    map.touchZoomRotate.disableRotation()

    const nav = new mapboxgl.NavigationControl({showCompass: false})
    map.addControl(nav, 'top-left')

    let unhighlight = null
    const popover = createPopup(PopoverContent, {
      closeButton: false,
      closeOnClick: false
    }).on('close', () => {
      popover.remove()
      if (unhighlight) unhighlight()
    })
    const tooltip = createPopup(TooltipContent, {
      closeButton: false,
      closeOnClick: false,
      anchor: 'center'
    })

    map.on('load', () => {
      map.addSource('ge-boundaries', {
        type: 'vector',
        url: 'mapbox://chachopazos.ge-boundaries'
      })

      YEARS.forEach(year => {
        map.addLayer({
          id: 'fill_' + year,
          source: 'ge-boundaries',
          'source-layer': 'ge-boundaries-' + year,
          type: 'fill',
          paint: {
            'fill-color': ['case',
              ['boolean', ['feature-state', 'highlighted'], false],
              'rgba(255, 0, 0, 0.6)',
              ['match',
                ['get', 'grc'],
                'SMC', 'rgba(25, 45, 86, 0.2)',
                '3-Member GRC', 'rgba(25, 45, 86, 0.35)',
                '4-Member GRC', 'rgba(25, 45, 86, 0.35)',
                '5-Member GRC', 'rgba(25, 45, 86, 0.60)',
                '6-Member GRC', 'rgba(25, 45, 86, 0.8)',
                'white'
              ]
            ],
            'fill-opacity': this.activeLayer === year ? 1 : 0,
            'fill-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })

        map.addLayer({
          id: 'outline_' + year,
          source: 'ge-boundaries',
          'source-layer': 'ge-boundaries-' + year,
          type: 'line',
          paint: {
            'line-color': 'white',
            'line-width': 1.2,
            'line-opacity': this.activeLayer === year ? 1 : 0,
            'line-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })
      })

      map.loadImage(require('../assets/pattern.png'), (err, image) => {
        if (err) return console.error(err)

        map.addImage('pattern', image)
        YEARS.forEach(year => {
          map.addLayer({
            id: 'pattern_' + year,
            source: 'ge-boundaries',
            'source-layer': 'ge-boundaries-' + year,
            type: 'fill',
            filter: ['!=', ['get', 'winner'], 'PAP'],
            paint: {
              'fill-pattern': 'pattern',
              'fill-opacity': this.activeLayer === year ? 1 : 0,
              'fill-opacity-transition': {
                duration: 500,
                delay: 0
              }
            }
          })
        })
      })

      this.$watch('activeLayer', (currLayer, prevLayer) => {
        map.setPaintProperty('fill_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('outline_' + prevLayer, 'line-opacity', 0)
        map.setPaintProperty('pattern_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('fill_' + currLayer, 'fill-opacity', 1)
        map.setPaintProperty('outline_' + currLayer, 'line-opacity', 1)
        map.setPaintProperty('pattern_' + currLayer, 'fill-opacity', 1)
        if (popover.isOpen()) openPopover.call(this)
      })

      map.on('mousemove', e => {
        if (popover.isOpen()) return
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['fill_' + this.activeLayer]
        })
        if (features.length > 0) {
          tooltip.setData(features[0].properties.constituency).trackPointer().addTo(map)
        } else {
          tooltip.setData(null).remove()
        }
      })

      map.on('click', e => {
        openPopover.call(this, e.lngLat)
      })
    })

    this.$refs.search.$on('select', row => {
      const lngLat = [+row.LONGITUDE, +row.LATITUDE]
      map.flyTo({
        center: lngLat,
        zoom: 12
      })
      openPopover.call(this, lngLat)
    })

    this.$refs.search.$on('clear', row => {
      map.flyTo(SINGAPORE)
    })

    fetch('/assets/legend.svg').then(res => res.text()).then(xml => {
      this.$refs.legend.innerHTML = xml
    })

    function openPopover (pt = popover.getLngLat()) {
      const sourceLayer = 'ge-boundaries-' + this.activeLayer
      const features = map.queryRenderedFeatures(map.project(pt), {
        layers: ['fill_' + this.activeLayer]
      })
      if (features.length > 0) {
        tooltip.setData(null).remove()
        const data = Object.assign({}, features[0].properties)
        Object.assign(data, this.additionalInfo[data.election][data.constituency])
        popover.setData(data).setLngLat(pt).addTo(map)
        if (unhighlight) unhighlight()
        map.setFeatureState({
          source: 'ge-boundaries',
          sourceLayer,
          id: features[0].id
        }, {highlighted: true})
        unhighlight = function () {
          map.setFeatureState({
            source: 'ge-boundaries',
            sourceLayer,
            id: features[0].id
          }, {highlighted: false})
          unhighlight = null
        }
      } else {
        popover.setData(null).remove()
        if (unhighlight) unhighlight()
      }
    }
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

.explorer-map {
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
