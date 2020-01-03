import Vue from 'vue'
import VueRouter from 'vue-router'

import ExplorerMap from './components/ExplorerMap.vue'
import ChangesMap from './components/ChangesMap.vue'
import GridMap from './components/GridMap.vue'

Vue.use(VueRouter)

export default new VueRouter({
  mode: 'history',
  routes: [
    {path: '/', component: ExplorerMap},
    {path: '/changes', component: ChangesMap},
    {path: '/grid', component: GridMap},
    {path: '*', redirect: '/'}
  ]
})
