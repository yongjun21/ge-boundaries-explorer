<template>
  <div class="buildings-map">
    <!-- <onemap-search ref="search" placeholder="eg. 1000 Toa Payoh or 318994" :max-length="0"></onemap-search> -->
    <!-- <div class="legend" ref="legend"></div> -->
    <input class="control" type="range" min="0" max="6" step="1" v-model="activeLayerIndex" />
    <h1 class="map-title">GE {{activeLayer}} Boundaries</h1>
  </div>
</template>

<script>
import Vue from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// import OnemapSearch from './OnemapSearch'
import PopoverContent from './PopoverContent'
import TooltipContent from './TooltipContent'

const BEDOK = {
  center: [103.92840945179253, 1.3240468743758742],
  zoom: 13
}

const YEARS = ['1988', '1991', '1997', '2001', '2006', '2011', '2015']

export default {
  name: 'BuildingsMap',
  // components: {
  //   OnemapSearch
  // },
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
  methods: {
    startAnimating () {
      this.animating = setTimeout(() => {
        this.activeLayerIndex = this.activeLayerIndex === 0 ? YEARS.length - 1 : this.activeLayerIndex - 1
        this.startAnimating()
      }, 1500)
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
    }, BEDOK))
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
      map.addSource('ge-boundaries-buildings', {
        type: 'vector',
        url: 'mapbox://chachopazos.ge-boundaries-buildings'
      })

      map.addSource('ura_planning_areas', {
        type: 'vector',
        url: 'mapbox://chachopazos.ura_planning_areas'
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
            'fill-color': ['case',
              ['boolean', ['feature-state', 'highlighted'], false],
              'rgba(0,0,0,0.6)',
              ['match',
                ['get', 'GE ' + year],
                'East Coast', 'rgba(255,0,0,0.6)',
                'Bedok', 'rgba(255,0,0,0.6)',
                'Tanah Merah', 'rgba(255,0,0,0.6)',
                'Siglap', 'rgba(255,0,0,0.6)',
                'Changi', 'rgba(255,0,0,0.6)',
                'Kampong Chai Chee', 'rgba(255,0,0,0.6)',
                'Marine Parade', 'rgba(0,0,255,0.6)',
                'Geylang Serai', 'rgba(0,0,255,0.6)',
                'Geylang East', 'rgba(0,0,255,0.6)',
                'Katong', 'rgba(0,0,255,0.6)',
                'Aljunied', 'rgba(0,128,0,0.6)',
                'Paya Lebar', 'rgba(0,128,0,0.6)',
                'Eunos', 'rgba(0,128,0,0.6)',
                'Tampines', 'rgba(255,128,0,0.6)',
                'Changkat', 'rgba(255,128,0,0.6)',
                'rgba(128,128,128,0.6)'
              ]
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
        if (popover.isOpen()) openPopover.call(this)
      })

      this.startAnimating()

      map.on('mousemove', e => {
        if (popover.isOpen()) return
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

      map.on('click', e => {
        // openPopover.call(this, e.lngLat)
      })
    })

    /*
    this.$refs.search.$on('select', row => {
      const lngLat = [+row.LONGITUDE, +row.LATITUDE]
      map.flyTo({
        center: lngLat,
        zoom: 12
      })
      openPopover.call(this, lngLat)
    })

    this.$refs.search.$on('clear', row => {
      map.flyTo(BEDOK)
    })
    */

    // fetch('/assets/legend.svg').then(res => res.text()).then(xml => {
    //   this.$refs.legend.innerHTML = xml
    // })

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
