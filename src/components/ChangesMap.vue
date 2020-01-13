<template>
  <div class="changes-map">
    <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search>
    <!-- <div class="legend" ref="legend"></div> -->
    <input class="control" type="range" min="0" max="6" step="1" v-model="activeLayerIndex" />
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

const YEARS = [1988, 1991, 1997, 2001, 2006, 2011, 2015]

export default {
  name: 'ChangesMap',
  components: {
    OnemapSearch
  },
  inject: ['additionalInfo'],
  data () {
    return {
      activeLayerIndex: 0
    }
  },
  computed: {
    activeLayer () {
      return YEARS[YEARS.length - this.activeLayerIndex - 1]
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

    let point = null
    let unhighlight = null
    const popover = createPopup(PopoverContent, {
      closeButton: false,
      closeOnClick: false
    }).on('close', () => {
      popover.remove()
      point = null
      if (unhighlight) unhighlight()
    })
    const tooltip = createPopup(TooltipContent, {
      closeButton: false,
      closeOnClick: false
    })

    map.on('load', () => {
      map.addSource('ge-boundaries', {
        type: 'vector',
        url: 'mapbox://chachopazos.ge-boundaries'
      })

      map.addSource('ge-boundaries-change', {
        type: 'vector',
        url: 'mapbox://chachopazos.ge-boundaries-change'
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
              'rgba(0, 0, 0, 0.6)',
              'transparent'
            ],
            'fill-opacity': this.activeLayer === year ? 1 : 0,
            'fill-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })

        map.addLayer({
          id: 'pattern_' + year,
          source: 'ge-boundaries-change',
          'source-layer': 'ge-boundaries-change-' + year,
          type: 'fill',
          paint: {
            // 'fill-color': ['case',
            //   // ['==', ['+', ['get', 'formation'], ['get', 'dissolution']], 2],
            //   // 'rgba(0,255,0,0.4)',
            //   ['==', ['get', 'formation'], 1],
            //   'rgba(255,0,0,0.4)',
            //   ['==', ['get', 'dissolution'], 1],
            //   'rgba(0,0,255,0.4)',
            //   'rgba(0,255,0,0.4)'
            // ],
            // 'fill-color': ['case',
            //   ['>', ['get', 'net_effect'], 0.15],
            //   'rgba(255,0,0,0.4)',
            //   ['<', ['get', 'net_effect'], -0.15],
            //   'rgba(0,0,255,0.4)',
            //   'rgba(0,255,0,0.4)'
            // ],
            'fill-color': ['let',
              'delta',
              ['-',
                ['match',
                  ['get', 'grc'],
                  '3-Member GRC', 3,
                  '4-Member GRC', 4,
                  '5-Member GRC', 5,
                  '6-Member GRC', 6,
                  1
                ],
                ['match',
                  ['get', 'prev_grc'],
                  '3-Member GRC', 3,
                  '4-Member GRC', 4,
                  '5-Member GRC', 5,
                  '6-Member GRC', 6,
                  1
                ]
              ],
              'same',
              ['all',
                ['==', ['get', 'constituency'], ['get', 'prev_constituency']],
                ['!=', ['get', 'grc'], 'SMC'],
                ['!=', ['get', 'prev_grc'], 'SMC']
              ],
              ['case',
                ['==', ['get', 'voters'], 0],
                'rgba(0,0,0,0.2)',
                ['<', ['var', 'delta'], 0],
                ['case',
                  ['var', 'same'], 'rgba(255,0,0,0.1)',
                  'rgba(255,0,0,0.4)'
                ],
                ['>', ['var', 'delta'], 0],
                ['case',
                  ['var', 'same'], 'rgba(0,0,255,0.1)',
                  'rgba(0,0,255,0.4)'
                ],
                'rgba(0,0,0,0.2)'
              ]
            ],
            // 'fill-outline-color': 'transparent',
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
            'line-color': 'rgb(96,96,96)',
            'line-width': 1.2,
            'line-opacity': this.activeLayer === year ? 1 : 0,
            'line-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })
      })

      this.$watch('activeLayer', (currLayer, prevLayer) => {
        map.setPaintProperty('fill_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('outline_' + prevLayer, 'line-opacity', 0)
        map.setPaintProperty('pattern_' + prevLayer, 'fill-opacity', 0)
        map.setPaintProperty('fill_' + currLayer, 'fill-opacity', 1)
        map.setPaintProperty('outline_' + currLayer, 'line-opacity', 1)
        map.setPaintProperty('pattern_' + currLayer, 'fill-opacity', 1)
        if (point) openPopover.call(this, point)
      })

      map.on('mousemove', e => {
        if (popover.isOpen()) return
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['pattern_' + this.activeLayer, 'fill_' + this.activeLayer]
        })
        if (features.length > 0) {
          tooltip.setData(getTooltipData(features[0].properties)).trackPointer().addTo(map)
        } else {
          tooltip.setData(null).remove()
        }
      })

      map.on('click', e => {
        point = openPopover.call(this, e.lngLat)
      })
    })

    this.$refs.search.$on('select', row => {
      point = [+row.LONGITUDE, +row.LATITUDE]
      map.flyTo({
        center: point,
        zoom: 12
      })
      openPopover.call(this, point)
    })

    this.$refs.search.$on('clear', row => {
      map.flyTo(SINGAPORE)
    })

    // fetch('/assets/legend.svg').then(res => res.text()).then(xml => {
    //   this.$refs.legend.innerHTML = xml
    // })

    function openPopover (pt) {
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
        point = null
        if (unhighlight) unhighlight()
      }
      return pt
    }
  }
}

function getTooltipData (prop) {
  const after = prop.constituency + (prop.grc === 'SMC' ? '' : ' GRC')
  if (!prop.prev_constituency) return after
  if (prop.constituency !== prop.prev_constituency) {
    const before = prop.prev_constituency + (prop.prev_grc === 'SMC' ? '' : ' GRC')
    return `${after}<br>(<small>previously</small> ${before})`
  }
  if ((prop.grc === 'SMC') !== (prop.prev_grc === 'SMC')) {
    const before = prop.prev_constituency + (prop.prev_grc === 'SMC' ? ' SMC' : ' GRC')
    return `${after}<br>(<small>previously</small> ${before})`
  }
  const change = prop.grc < prop.prev_grc ? 'downsized' : 'upsized'
  return `${after}<br>(<small>${change} to ${prop.grc}</small>)`
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

.changes-map {
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
