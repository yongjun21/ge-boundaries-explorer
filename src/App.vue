<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
const additionalInfo = {}
window.fetch('https://st-graphics-dev-json.s3-ap-southeast-1.amazonaws.com/1HH5MLZu2lukbjDGMWhW_wdT7Jm0PxJN37i6EC3CaaD0/690133933.json')
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
