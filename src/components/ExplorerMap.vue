<template>
  <div class="locator-map">
    <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search>
    <div class="legend" ref="legend"></div>
    <input class="control" type="range" min="0" max="7" step="1" v-model="activeLayerIndex" />
    <h1 class="map-title">GE {{activeLayer.slice(-4)}} Boundaries</h1>
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

const TILESETS = {
  'ge-boundaries-2015': 'mapbox://chachopazos.ck1m9x5hj0r4r2uqe7tomyjrr-1ee8k',
  'ge-boundaries-2011': 'mapbox://chachopazos.ck1m9yos507hv2nr1dq3t6vzu-7cp30',
  'ge-boundaries-2006': 'mapbox://chachopazos.ck1ma056008j32op91wg7w2b9-1wo9k',
  'ge-boundaries-2001': 'mapbox://chachopazos.ck1pyuuot6bk12pmsa6r0p28m-8nmol',
  'ge-boundaries-1997': 'mapbox://chachopazos.ck1ma2skb0jfm2jpats0hxl1d-53n12',
  'ge-boundaries-1991': 'mapbox://chachopazos.ck1ma4il700go2qoejylw8nd4-3qt1l',
  'ge-boundaries-1988': 'mapbox://chachopazos.ck1ma62oo08by2or1cst0281q-89qsd',
  'ge-boundaries-1984': 'mapbox://chachopazos.ck1maoead1jwr2umqou0rchpa-7226w'
}

export default {
  components: {
    OnemapSearch
  },
  data () {
    return {
      activeLayerIndex: 0
    }
  },
  computed: {
    activeLayer () {
      return Object.keys(TILESETS)[this.activeLayerIndex]
    }
  },
  mounted () {
    const map = new mapboxgl.Map(Object.assign({
      container: this.$el,
      style: 'mapbox://styles/chachopazos/ck1bl0hnl08yg1cpfebi9u94l',
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

    const marker = new mapboxgl.Marker()
    const popover = createPopup(PopoverContent, {
      closeButton: false,
      closeOnClick: false
    }).on('close', () => popover.remove())
    const tooltip = createPopup(TooltipContent, {
      closeButton: false,
      closeOnClick: false,
      anchor: 'center'
    })

    map.on('load', () => {
      Object.entries(TILESETS).forEach(([source, url]) => {
        map.addSource(source, {
          type: 'vector',
          url
        })

        map.addLayer({
          id: source + '_fill',
          source,
          'source-layer': source,
          type: 'fill',
          paint: {
            'fill-color': ['match',
              ['get', 'grc'],
              'SMC', 'rgba(25, 45, 86, 0.2)',
              '3-Member GRC', 'rgba(25, 45, 86, 0.35)',
              '4-Member GRC', 'rgba(25, 45, 86, 0.35)',
              '5-Member GRC', 'rgba(25, 45, 86, 0.60)',
              '6-Member GRC', 'rgba(25, 45, 86, 0.8)',
              'white'
            ],
            'fill-opacity': this.activeLayer === source ? 1 : 0,
            'fill-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })

        map.addLayer({
          id: source + '_outline',
          source,
          'source-layer': source,
          type: 'line',
          paint: {
            'line-color': 'white',
            'line-width': 1.2,
            'line-opacity': this.activeLayer === source ? 1 : 0,
            'line-opacity-transition': {
              duration: 500,
              delay: 0
            }
          }
        })
      })

      this.$watch('activeLayer', (layer, prevLayer) => {
        map.setPaintProperty(prevLayer + '_fill', 'fill-opacity', 0)
        map.setPaintProperty(prevLayer + '_outline', 'line-opacity', 0)
        map.setPaintProperty(layer + '_fill', 'fill-opacity', 1)
        map.setPaintProperty(layer + '_outline', 'line-opacity', 1)
      })

      map.on('mousemove', e => {
        if (popover.isOpen()) return
        const features = map.queryRenderedFeatures(e.point, {
          layers: [this.activeLayer + '_fill']
        })
        if (features.length > 0) {
          tooltip.setData(features[0].properties.constituency).trackPointer().addTo(map)
        } else {
          tooltip.setData(null).remove()
        }
      })

      map.on('click', e => {
        if (popover.isOpen()) return popover.remove()
        const features = map.queryRenderedFeatures(e.point, {
          layers: [this.activeLayer + '_fill']
        })
        if (features.length > 0) {
          tooltip.setData(null).remove()
          popover.setData(features[0].properties).setLngLat(e.lngLat).addTo(map)
        } else {
          popover.setData(null).remove()
        }
      })
    })

    this.$refs.search.$on('select', row => {
      const coordinates = [+row.LONGITUDE, +row.LATITUDE]
      map.flyTo({
        center: coordinates,
        zoom: 14
      })
      marker.setLngLat(coordinates).addTo(map)
    })

    this.$refs.search.$on('clear', row => {
      map.flyTo(SINGAPORE)
      marker.remove()
    })

    fetch('/assets/legend.svg').then(res => res.text()).then(xml => {
      this.$refs.legend.innerHTML = xml
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

.locator-map {
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
