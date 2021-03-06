<template>
  <div class="grid-map">
    <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search>
    <!-- <div class="legend" ref="legend"></div> -->
    <input class="control" type="range" min="0" max="6" step="1" v-model="activeLayerIndex" />
    <h1 class="map-title">GE {{activeLayer}} Boundaries</h1>
  </div>
</template>

<script>
/* eslint-disable standard/computed-property-even-spacing */

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

const YEARS = ['1988', '1991', '1997', '2001', '2006', '2011', '2015', '2020']

export default {
  name: 'GridMap',
  components: {
    OnemapSearch
  },
  inject: ['additionalInfo'],
  props: ['cumulative'],
  data () {
    const year = this.$route.query.year || '2020'
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
      style: 'mapbox://styles/yongjun21/ckd5mel1y0r3t1is4tkv0ye89',
      minZoom: 10,
      maxZoom: 16,
      maxBounds: [[103.42295489648154, 1.0774867904165433], [104.21671710351262, 1.6266481512753188]],
      scrollZoom: true,
      dragPan: true,
      dragRotate: false,
      accessToken: 'pk.eyJ1IjoieW9uZ2p1bjIxIiwiYSI6ImNpdTY5c2tyZzBqaDgyemxwYjk0Nnlic2UifQ.A5OHCYPcLTupbo1Qi3t5OQ'
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
      closeOnClick: false
    })

    map.on('load', () => {
      map.addSource('ge-boundaries-grid', {
        type: 'vector',
        url: 'mapbox://yongjun21.ge-boundaries-grid'
      })

      YEARS.forEach(year => {
        map.addLayer({
          id: 'fill_' + year,
          source: 'ge-boundaries-grid',
          'source-layer': 'ge-boundaries-grid',
          type: 'fill',
          filter: ['has', 'GE ' + year + '_constituency'],
          paint: {
            'fill-color': this.cumulative ? getFillColor2(year) : getFillColor(year),
            'fill-outline-color': 'transparent',
            'fill-opacity': this.activeLayer === year ? 1 : 0,
            'fill-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })

        map.addLayer({
          id: 'outline_' + year,
          source: 'ge-boundaries-grid',
          'source-layer': 'ge-boundaries-grid-outline',
          type: 'line',
          filter: ['==', ['get', 'election'], 'GE ' + year],
          paint: {
            'line-color': 'lightgrey',
            'line-width': 1.2,
            'line-opacity': this.activeLayer === year ? 1 : 0,
            'line-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })
      })

      this.$watch('activeLayer', (currlayer, prevLayer) => {
        map.setPaintProperty('fill_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('fill_' + currlayer, 'fill-opacity', 1)
        map.setPaintProperty('outline_' + prevLayer, 'line-opacity', 0)
        map.setPaintProperty('outline_' + currlayer, 'line-opacity', 1)
        if (popover.isOpen()) openPopover.call(this)
      })

      map.on('mousemove', e => {
        if (popover.isOpen()) return
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['fill_' + this.activeLayer]
        })
        if (features.length > 0) {
          tooltip.setData(getTooltipData(features[0].properties, this.activeLayer)).trackPointer().addTo(map)
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

    // fetch('/assets/legend.svg').then(res => res.text()).then(xml => {
    //   this.$refs.legend.innerHTML = xml
    // })

    function openPopover (pt = popover.getLngLat()) {
      const features = map.queryRenderedFeatures(map.project(pt), {
        layers: ['fill_' + this.activeLayer]
      })
      if (features.length > 0) {
        tooltip.setData(null).remove()
        const election = 'GE ' + this.activeLayer
        const data = {
          election,
          constituency: features[0].properties[election + '_constituency'],
          grc: features[0].properties[election + '_grc']
        }
        Object.assign(data, this.additionalInfo[data.election][data.constituency])
        popover.setData(data).setLngLat(pt).addTo(map)
        if (unhighlight) unhighlight()
        /*
        map.setFeatureState({
          source: 'ge-boundaries-grid',
          sourceLayer: 'ge-boundaries-grid-outline',
          id: features[0].id
        }, {highlighted: true})
        unhighlight = function () {
          map.setFeatureState({
            source: 'ge-boundaries-grid',
            sourceLayer: 'ge-boundaries-grid-outline',
            id: features[0].id
          }, {highlighted: false})
          unhighlight = null
        }
        */
      } else {
        popover.setData(null).remove()
        if (unhighlight) unhighlight()
      }
      return pt
    }
  }
}

function getFillColor (year) {
  const index = YEARS.indexOf(year)
  if (index === 0) return 'rgba(255,255,255,0.6)'
  const curr = 'GE ' + year
  const prev = 'GE ' + YEARS[index - 1]
  return ['case',
    compareExp(curr, prev),
    'rgba(0,0,0,0.6)',
    'rgba(255,255,255,0.6)'
  ]
}

function getFillColor2 (year) {
  const index = YEARS.indexOf(year)
  if (index === 0) return 'rgba(255,255,255,0.6)'
  const exp = ['match',
    ['+'],
    1, 'rgba(254,237,222,0.8)',
    2, 'rgba(253,190,133,0.8)',
    3, 'rgba(253,141,60,0.8)',
    4, 'rgba(230,85,13,0.8)',
    5, 'rgba(166,54,3,0.8)',
    'rgba(255,255,255,0.6)'
  ]
  for (let i = 0; i < index; i++) {
    const curr = 'GE ' + YEARS[i + 1]
    const prev = 'GE ' + YEARS[i]
    exp[1].push(['case', compareExp(curr, prev), 1, 0])
  }
  return exp
}

function compareExp (curr, prev) {
  return ['all',
    ['has', curr + '_constituency'],
    ['has', prev + '_constituency'],
    ['any',
      ['!=',
        ['get', curr + '_constituency'],
        ['get', prev + '_constituency']
      ],
      ['!=',
        ['match', ['get', curr + '_grc'], 'SMC', 'SMC', 'GRC'],
        ['match', ['get', prev + '_grc'], 'SMC', 'SMC', 'GRC']
      ]
    ]
  ]
}

function getTooltipData (prop, year) {
  const index = YEARS.indexOf(year)
  const curr = 'GE ' + year
  const after = prop[curr + '_constituency'] + (prop[curr + '_grc'] === 'SMC' ? '' : ' GRC')
  if (index === 0) return after
  const prev = 'GE ' + YEARS[index - 1]
  if (prop[prev + '_constituency'] == null) return after
  const before = prop[prev + '_constituency'] + (prop[prev + '_grc'] === 'SMC' ? '' : ' GRC')
  if (before !== after) return `${after}<br>(<small>previously</small> ${before})`
  else return after
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

.grid-map {
  width: 100%;
  height: 800px;

  .onemap-search {
    display: block;
    position: absolute;
    z-index: 1;
    top: 20px;
    right: 20px;
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
    left: 0;
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
