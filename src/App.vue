<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import ExplorerMap from './components/ExplorerMap.vue'

export default {
  name: 'app',
  components: {
    ExplorerMap
  }
}
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
  margin: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
