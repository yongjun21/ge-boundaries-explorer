<template>
  <div class="tooltip-content" v-if="data" v-html="data"></div>
</template>

<script>
export default {
  data () {
    return {
      data: null
    }
  }
}
</script>

<style lang="scss">
.tooltip-content {
  z-index: 1;
}
</style>
