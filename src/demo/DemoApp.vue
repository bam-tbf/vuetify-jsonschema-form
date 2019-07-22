<template lang="html">
  <v-app>
    <v-app-bar color="primary" dark fixed app>
      <v-toolbar-title>vuetify-jsonschema-form demo</v-toolbar-title>
    </v-app-bar>
    <v-content>
      <v-container fluid>
        <v-row>
          <v-col cols="6">
            <h2 class="title my-4">
              Schema:
            </h2>
            <v-row>
              <v-col cols="6">
                <v-select v-model="example" :items="examples" :return-object="true" item-text="title" label="Choose an example" @change="applyExample" />
              </v-col>
              <v-col cols="6">
                <v-container>
                  <v-row>
                    <v-btn color="primary" @click="applySchema">
                      Apply
                    </v-btn>
                    <v-btn @click="formatSchema">
                      Format
                    </v-btn>
                  </v-row>
                </v-container>
              </v-col>
            </v-row>

            <v-textarea v-model="schemaStr" :error-messages="schemaError ? [schemaError.message] : []" :rows="20" />
          </v-col>
          <v-col cols="6">
            <h2 class="title my-4">
              Form
              <v-chip v-if="formValid" color="success">
                valid
              </v-chip>
              <v-chip v-else color="danger">
                invalid
              </v-chip>
              <v-btn color="primary" @click="$refs.myForm.validate()">
                validate
              </v-btn>
            </h2>

            <v-form ref="myForm" v-model="formValid">
              <v-jsonschema-form
                v-if="schema"
                :schema="schema"
                :model="dataObject"
                :options="{debug: true, disableAll: false, autoFoldObjects: true, context: {owner: {type: 'organization', id: '5a5dc47163ebd4a6f438589b'}}, accordionMode: 'normal'}"
                @error="e => window.alert(e)"
                @change="change"
                @input="input"
              />
            </v-form>
            <h2 class="title my-4">
              Data:
            </h2>
            <pre>{{ JSON.stringify(dataObject, null, 2) }}</pre>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import VJsonschemaForm from '../lib/index.vue'
import examples from './examples'
import hjson from 'hjson' // more tolerant parsing of the schema for easier UX

export default {
  components: { VJsonschemaForm },
  data: function () {
    return {
      window,
      schema: null,
      schemaStr: '{}',
      schemaError: null,
      dataObject: {},
      examples,
      example: examples[0],
      formValid: false
    }
  },
  mounted () {
    this.applyExample()
  },
  methods: {
    applySchema () {
      try {
        this.schema = hjson.parse(this.schemaStr)
        this.schemaError = null
      } catch (err) {
        this.schemaError = err
      }
    },
    formatSchema () {
      try {
        const schema = hjson.parse(this.schemaStr)
        this.schemaStr = JSON.stringify(schema, null, 2)
        this.schemaError = null
      } catch (err) {
        this.schemaError = err
      }
    },
    applyExample () {
      this.schema = null
      setTimeout(() => {
        this.dataObject = JSON.parse(JSON.stringify(this.example.data || {}))
        this.schemaStr = JSON.stringify(this.example.schema, null, 2)
        this.applySchema()
      }, 1)
    },
    change (e) {
      console.log('"change" event', e)
    },
    input (e) {
      console.log('"input" event', e)
    }
  }
}
</script>

<style lang="css">
</style>
