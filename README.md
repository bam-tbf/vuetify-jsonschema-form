# vuetify2-jsonschema-form

Generate forms for the [Vuetify 2.x](https://vuetifyjs.com/en/) UI library (Vue.js) based on annotated JSON schemas.

Using Vuetify 2.x with ability to pass flexbox options to manage layout.

For a view of all the functionalities run the demo

```bash
yarn
yarn serve
# Visit the demo at localhost:8080
```


## Installation

```bash
npm i --save @bam-tbf/vuetify2-jsonschema-form
```

## Usage

```html
<template>
  <v-form v-model="formValid">
    <v-jsonschema-form v-if="schema" :schema="schema" :model="dataObject" :options="options" @error="showError" @change="showChange" @input="showInput" />
  </v-form>
</template>

<script>
import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import Draggable from 'vuedraggable'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'
import VJsonschemaForm from '@bam-tbf/vuetify2-jsonschema-form'
import '@bam-tbf/vuetify2-jsonschema-form/dist/main.css'
import { Sketch } from 'vue-color'

Vue.use(Vuetify)
Vue.use(VueAxios, axios)

Vue.component('swatches', Swatches)
Vue.component('draggable', Draggable)
Vue.component('color-picker', Sketch)

export default {
  components: {VJsonschemaForm},
  data() {
    return {
      schema: {...},
      dataObject: {},
      formValid: false,
      options: {
        debug: false,
        disableAll: false,
        autoFoldObjects: true
      }
    }
  },
  methods: {
    showError(err) {
      window.alert(err)
    },
    showChange(e) {
      console.log('"change" event', e)
    },
    showInput(e) {
      console.log('"input" event', e)
    }
  }
}
</script>
```

The library can also be loaded from source if you use [Vuetify "à la carte"](https://vuetifyjs.com/en/framework/a-la-carte). In this case you will have to instruct your build tool to transpile the source with babel.

See the example json schemas in the src/demo/examples folder for additional details on usage.

```js
import VJsonschemaForm from '@bam-tbf/vuetify2-jsonschema-form/lib/index.vue'
```

## Roadmap

This is a work in progress and will be extended in the next several months (2019).


## Acknowledgements

Gratefully forked and extended from [koumoul-dev/vuetify-jsonschema-form](https://github.com/koumoul-dev/vuetify-jsonschema-form.git) to support Vuetify 2.x and configurable flexbox layouts.
