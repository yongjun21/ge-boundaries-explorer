<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
const additionalInfo = {}
window.fetch('https://assets.yongjun.sg/election/constituencies.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(row => {
      additionalInfo[row.election] = additionalInfo[row.election] || {}
      additionalInfo[row.election][row.constituency] = row
    })
  })

export default {
  name: 'app',
  provide: {
    additionalInfo
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
