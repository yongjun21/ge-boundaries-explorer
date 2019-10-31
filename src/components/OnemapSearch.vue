<template>
  <span class="onemap-search">
    <v-suggest
      ref="suggest"
      v-model="value"
      :data="suggestions"
      v-bind="$attrs"
      show-field="ADDRESS"
      @values="handleSelect">
      <template v-slot="{row}">
        <suggestion v-bind="row"></suggestion>
      </template>
    </v-suggest>
    <img :src="require('../assets/search-icon.svg')" alt="" class="search-icon">
  </span>
</template>

<script>
import {Suggest} from 'v-suggest'

const DUMMY_SUGGESTIONS = [{ADDRESS: ''}]

const Suggestion = {
  functional: true,
  render (h, {props}) {
    const splited = props.ADDRESS.split('SINGAPORE')
    const top = splited[0].trim().toLowerCase()
    const bottom = splited[1] ? 'Singapore' + splited[1] : null
    return [
      h('div', {class: 'suggestion top-row'}, capitalize(top)),
      h('div', {class: 'suggestion bottom-row'}, bottom)
    ]
  }
}

export default {
  components: {
    'v-suggest': Suggest,
    Suggestion
  },
  props: {
    minLength: {
      type: Number,
      default: 3
    }
  },
  data () {
    return {
      value: '',
      suggestions: DUMMY_SUGGESTIONS
    }
  },
  methods: {
    handleInput () {
      if (this.value.length >= this.minLength) {
        fetch(`https://developers.onemap.sg/commonapi/search?searchVal=${this.value.trim()}&returnGeom=Y&getAddrDetails=Y&pageNum=1`)
          .then(res => res.json())
          .then(json => {
            this.suggestions = json.results.length > 0
                             ? json.results.map(Object.freeze)
                             : DUMMY_SUGGESTIONS
            this.$refs.suggest.highlight = 0
          })
      } else {
        this.suggestions = DUMMY_SUGGESTIONS
      }
      if (this.value.length === 0) this.$emit('clear')
    },
    handleSelect (row) {
      this.$emit('select', row)
    }
  },
  watch: {
    value: 'handleInput'
  }
}

function capitalize (str) {
  return str.split(' ').map(substr => {
    return substr.split('-').map((w, i) => {
      if (w.match(/^\d+\D*$/)) return w.toUpperCase()
      if (i > 0 && w.match(/^(a|the|at|on)$/i)) return w.toLowerCase()
      if (w.match(/^(hdb|cbd|ura|nus|ntu|smu)$/i)) return w.toUpperCase()
      return w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase()
    }).join('-')
  }).join(' ')
}
</script>

<style lang="scss">
$font-CuratorRegular: 'CuratorRegular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
$font-CuratorBold: 'CuratorBold', 'Helvetica Neue', Helvetica, Arial, sans-serif;

.onemap-search {
  .v-suggest input[type="text"],
  .v-suggest input[type="text"]:focus {
    box-sizing: border-box;
    width: 300px;
    padding-left: 35px;
    border-radius: 20px;
    border: 1px solid rgba(51, 51, 51, 0.8);
    font-family: $font-CuratorRegular;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    top: 10px;
    height: 1rem;
  }
}

.suggestion {
  // word-break: normal;
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;

  &.top-row {
    font-size: 14px;
  }

  &.bottom-row {
    font-size: 12px;
    text-align: right;
  }
}
</style>
