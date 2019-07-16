import Vue from 'vue'
import Vuetify from 'vuetify'
// import 'vuetify/dist/vuetify.min.css'

import DemoApp from '@/demo/DemoApp.vue'
import Draggable from 'vuedraggable'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'
import { Sketch } from 'vue-color'

const vuetifyOptions = { }

Vue.use(Vuetify)
Vue.use(VueAxios, axios)

Vue.component('swatches', Swatches)
Vue.component('draggable', Draggable)
Vue.component('color-picker', Sketch)

// eslint-disable-next-line
new Vue({
  el: '#app',
  vuetify: new Vuetify(vuetifyOptions),
  components: { DemoApp },
  render: h => h('demo-app')
})
