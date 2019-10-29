<template>
  <div class="popover-content" v-if="data">
    <img class="close-btn" :src="require('../assets/close.svg')" alt="" @click="$emit('close')"/>
    <div class="title">{{data.constituency}}</div>
    <div class="other-data">
      <div>{{data.grc}}</div>
      <div>{{data.voters.toLocaleString()}} voters</div>
    </div>
  </div>
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
$font-CuratorRegular: 'CuratorRegular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
$font-CuratorBold: 'CuratorBold', 'Helvetica Neue', Helvetica, Arial, sans-serif;

.popover-content {
  padding: 8px 5px;
  z-index: 2;

  .close-btn {
    width: 10px;
    position: absolute;
    right: 0;
    top: 0;
    padding: 5px;
    cursor: pointer;
  }

  .title {
    padding: 0 20px 0 0;
    font-family: $font-CuratorBold;
    font-size: 15px;
  }

  .other-data {
    font-size: 14px;
  }
}
</style>
