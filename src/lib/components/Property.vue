<template>
  <!-- Hide const ? Or make a readonly field -->
  <div v-if="fullSchema && fullSchema.const === undefined && fullSchema['x-display'] !== 'hidden'" class="vjsf-property">
    <!-- Date picker -->
    <v-menu v-if="fullSchema.type === 'string' && ['date', 'date-time'].includes(fullSchema.format)" ref="menu" v-model="menu" :close-on-content-click="false"
            :nudge-right="40"
            :return-value.sync="modelWrapper[modelKey]"
            :disabled="disabled"
            transition="scale-transition"
            offset-y
            full-width
            min-width="290px"
    >
      <template #activator="{ on }">
        <v-text-field
          v-on="on"
          v-model="modelWrapper[modelKey]"
          :label="label"
          :name="fullKey"
          :required="required"
          :rules="rules"
          :clearable="!required"
          prepend-icon="event"
          readonly
        >
          <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
            <template #activator="{ on }">
              <v-icon v-on="on">
                info
              </v-icon>
            </template>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
        </v-text-field>
      </template>
      <v-date-picker v-model="modelWrapper[modelKey]" no-title scrollable>
        <div class="flex-grow-1"></div>
        <v-btn text color="primary" @click="menu = false">
          Cancel
        </v-btn>
        <v-btn text color="primary" @click="$refs.menu.save(modelWrapper[modelKey]); change(); input()">
          OK
        </v-btn>
      </v-date-picker>
    </v-menu>

    <!-- Color picking -->
    <template v-else-if="fullSchema.format === 'hexcolor'">
      <template v-if="fullSchema['x-display'] === 'color-picker'">
        <v-input
          :name="fullKey"
          :label="label"
          :required="required"
          :rules="rules"
          :disabled="disabled"
        >
          <v-tooltip v-if="fullSchema.description" slot="append" left>
            <template #activator="{ on }">
              <v-icon v-on="on">
                info
              </v-icon>
            </template>
            <div class="vjsf-tooltip" v-html="htmlDescription" />
          </v-tooltip>
          &nbsp;&nbsp;
          <v-menu :close-on-content-click="false" :close-on-click="true" direction="bottom" offset-y>
            <template #activator="{ on }">
              <div v-on="on" :style="`background-color: ${modelWrapper[modelKey]};`" :class="modelWrapper[modelKey] ? 'color-picker-trigger' : 'color-picker-trigger color-picker-trigger-empty'" />
            </template>
            <color-picker :value="modelWrapper[modelKey]" :preset-colors="options.colors.swatches" @input="(val) => {modelWrapper[modelKey] = val.hex; input(); change()}" />
          </v-menu>
        </v-input>
      </template>
      <v-input v-else
               :name="fullKey"
               :label="label"
               :required="required"
               :rules="rules"
               :disabled="disabled"
      >
        <v-tooltip v-if="fullSchema.description" slot="append" left>
          <template #activator="{ on }">
            <v-icon v-on="on">
              info
            </v-icon>
          </template>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
        &nbsp;&nbsp;
        <swatches
          v-model="modelWrapper[modelKey]"
          :disabled="disabled"
          :colors="options.colors"
          :trigger-style="{width:'36px', height:'36px'}"
          shapes="circles"
          @input="input();change()"
        />
      </v-input>
    </template>

    <!-- Select field based on an enum (array or simple value) -->
    <template v-else-if="(fullSchema.type === 'array' && fullSchema.items.enum) || fullSchema.enum">
      <!--{{ selectItems }}<br>
      {{ modelWrapper[modelKey] }}-->
      <v-select
        v-model="modelWrapper[modelKey]"
        :items="selectItems"
        :name="fullKey"
        :label="label"
        :required="required"
        :rules="rules"
        :disabled="disabled"
        :clearable="!required"
        :multiple="fullSchema.type === 'array'"
        @change="change"
        @input="input"
      >
        <template slot="selection" slot-scope="data">
          <div class="v-select__selection v-select__selection--comma">
            <select-icon v-if="itemIcon" :value="data.item" />
            <span v-if="![null, undefined].includes(data.item)">{{ data.item + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}</span>
          </div>
        </template>
        <template slot="item" slot-scope="data">
          <select-icon v-if="itemIcon" :value="data.item" />
          {{ data.item }}
        </template>

        <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
          <template #activator="{ on }">
            <v-icon v-on="on">
              info
            </v-icon>
          </template>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-select>
    </template>

    <!-- Select field based on a oneOf on a simple type (array or simple value) -->
    <!-- cf https://github.com/mozilla-services/react-jsonfullSchema-form/issues/532 -->
    <template v-else-if="oneOfSelect">
      <v-select
        v-model="modelWrapper[modelKey]"
        :items="selectItems"
        :name="fullKey"
        :label="label"
        :required="required"
        :disabled="disabled"
        :rules="rules"
        :clearable="!required"
        :multiple="fullSchema.type === 'array'"
        :item-text="itemTitle"
        :item-value="itemKey"
        @change="change"
        @input="input"
      >
        <template slot="selection" slot-scope="data">
          <div class="v-select__selection v-select__selection--comma">
            <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
            <span v-if="![null, undefined].includes(data.item[itemTitle])">{{ data.item[itemTitle] + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}</span>
          </div>
        </template>
        <template slot="item" slot-scope="data">
          <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
          {{ data.item[itemTitle] }}
        </template>

        <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
          <template #activator="{ on }">
            <v-icon v-on="on">
              info
            </v-icon>
          </template>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-select>
    </template>

    <!-- Select field on an ajax response or from an array in another part of the data -->
    <v-select v-else-if="fullSchema['x-display'] !== 'list' && (fromUrl || fullSchema['x-fromData'])"
              v-model="modelWrapper[modelKey]"
              :items="selectItems"
              :name="fullKey"
              :label="label"
              :no-data-text="options.noDataMessage"
              :disabled="disabled"
              :required="required"
              :rules="rules"
              :item-text="itemTitle"
              :item-value="itemKey"
              :return-object="(fullSchema.type === 'array' && fullSchema.items.type === 'object') || fullSchema.type === 'object'"
              :clearable="!required"
              :loading="loading"
              :multiple="fullSchema.type === 'array'"
              @change="change"
              @input="input"
    >
      <template slot="selection" slot-scope="data">
        <div class="v-select__selection v-select__selection--comma">
          <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
          <span v-if="![null, undefined].includes(data.item[itemTitle])">{{ data.item[itemTitle] + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}</span>
        </div>
      </template>
      <template slot="item" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        {{ data.item[itemTitle] }}
      </template>

      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-select>

    <!-- auto-complete field on an ajax response with query -->
    <v-autocomplete v-else-if="fromUrlWithQuery"
                    v-model="modelWrapper[modelKey]"
                    :items="selectItems"
                    :search-input.sync="q"
                    :name="fullKey"
                    :label="label"
                    :no-data-text="options.noDataMessage"
                    :disabled="disabled"
                    :required="required"
                    :rules="rules"
                    :item-text="itemTitle"
                    :item-value="itemKey"
                    :return-object="(fullSchema.type === 'array' && fullSchema.items.type === 'object') || fullSchema.type === 'object'"
                    :clearable="!required"
                    :filter="() => true"
                    :placeholder="options.searchMessage"
                    :loading="loading"
                    :multiple="fullSchema.type === 'array'"
                    @change="change"
                    @input="input"
    >
      <template slot="selection" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        <div v-if="![null, undefined].includes(data.item[itemTitle])">
          {{ data.item[itemTitle] + (fullSchema.type === 'array' && data.index !== modelWrapper[modelKey].length - 1 ? ',&nbsp;' : '') }}
        </div>
      </template>
      <template slot="item" slot-scope="data">
        <select-icon v-if="itemIcon" :value="data.item[itemIcon]" />
        {{ data.item[itemTitle] }}
      </template>

      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-autocomplete>

    <!-- Long text field in a textarea -->
    <v-textarea v-else-if="fullSchema.type === 'string' && (fullSchema.maxLength && fullSchema.maxLength > 1000 && fullSchema['x-display'] !== 'single-line')"
                v-model="modelWrapper[modelKey]"
                :name="fullKey"
                :label="label"
                :disabled="disabled"
                :required="required"
                :rules="rules"
                filled
                @change="change"
                @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-textarea>

    <!-- text field displayed as password -->
    <v-text-field v-else-if="fullSchema.type === 'string' && fullSchema['x-display'] === 'password'"
                  v-model="modelWrapper[modelKey]"
                  :name="fullKey"
                  :label="label"
                  :disabled="disabled"
                  :required="required"
                  :rules="rules"
                  type="password"
                  @change="change"
                  @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="{  on }">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-text-field>

    <!-- Simple text field -->
    <v-text-field v-else-if="fullSchema.type === 'string'"
                  v-model="modelWrapper[modelKey]"
                  :name="fullKey"
                  :label="label"
                  :disabled="disabled"
                  :required="required"
                  :rules="rules"
                  @change="change"
                  @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-text-field>

    <!-- Simple number fields -->
    <v-text-field v-else-if="fullSchema.type === 'number' || fullSchema.type === 'integer'"
                  v-model.number="modelWrapper[modelKey]"
                  :name="fullKey"
                  :label="label"
                  :min="fullSchema.minimum"
                  :max="fullSchema.maximum"
                  :step="fullSchema.type === 'integer' ? 1 : 0.01"
                  :disabled="disabled"
                  :required="required"
                  :rules="rules"
                  type="number"
                  @change="change"
                  @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-text-field>

    <!-- Simple boolean field -->
    <v-checkbox v-else-if="fullSchema.type === 'boolean'"
                v-model="modelWrapper[modelKey]"
                :label="label"
                :name="fullKey"
                :disabled="disabled"
                :required="required"
                :rules="rules"
                @change="change"
                @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
    </v-checkbox>

    <!-- Simple strings array -->
    <v-combobox
      v-else-if="fullSchema.type === 'array' && fullSchema.items.type === 'string'"
      v-model="modelWrapper[modelKey]"
      :name="fullKey"
      :label="label"
      :required="required"
      :rules="rules"
      :disabled="disabled"
      chips
      multiple
      append-icon=""
      @change="change"
      @input="input"
    >
      <v-tooltip v-if="fullSchema.description" slot="append-outer" left>
        <template #activator="{ on }">
          <v-icon v-on="on">
            info
          </v-icon>
        </template>
        <div class="vjsf-tooltip" v-html="htmlDescription" />
      </v-tooltip>
      <template slot="selection" slot-scope="data">
        <v-chip
          :input-value="data.selected"
          close
          @input="modelWrapper[modelKey].splice(modelWrapper[modelKey].indexOf(data.item)); change(); input()"
        >
          {{ data.item }}
        </v-chip>
      </template>
    </v-combobox>

    <!-- Object sub container with properties that may include a select based on a oneOf and subparts base on a allOf -->
    <div v-else-if="fullSchema.type === 'object'">
      <v-subheader v-if="fullSchema.title" :style="foldable ? 'cursor:pointer;' :'' " class="mt-2" @click="folded = !folded">
        {{ fullSchema.title }}
        &nbsp;
        <v-icon v-if="foldable && folded">
          arrow_drop_down
        </v-icon>
        <v-icon v-if="foldable && !folded">
          arrow_drop_up
        </v-icon>
      </v-subheader>

      <v-slide-y-transition>
        <v-container v-show="!foldable || !folded" v-bind="fullSchema['x-layout-options'].container">
          <v-row v-bind="fullSchema['x-layout-options'].row">
            <v-col v-bind="fullSchema['x-layout-options'].col">
              <p v-if="fullSchema.description">
                {{ fullSchema.description }}
              </p>
            </v-col>
            <v-col v-for="childProp in fullSchema.properties" :key="childProp.key" v-bind="childProp['x-col'] || fullSchema['x-layout-options'].col">
              <property
                        :schema="childProp"
                        :model-wrapper="modelWrapper[modelKey]"
                        :model-root="modelRoot"
                        :model-key="childProp.key"
                        :parent-key="fullKey + '.'"
                        :required="!!(fullSchema.required && fullSchema.required.includes(childProp.key))"
                        :options="options"
                        @error="e => $emit('error', e)"
                        @change="e => $emit('change', e)"
                        @input="e => $emit('input', e)"
              />
            </v-col>

              <!-- Sub containers for allOfs -->
            <template v-if="fullSchema.allOf && fullSchema.allOf.length">
              <template v-if="!parentKey && fullSchema.allOf[0].title">
                <!-- Accordion / expansion panets at root level -->
                <v-col v-bind="fullSchema['x-layout-options'].col">
                  <v-expansion-panels accordion>
                    <v-expansion-panel
                      v-for="(currentAllOf, i) in fullSchema.allOf" :key="i"
                      :inset="options.accordionMode === 'inset'"
                      :popout="options.accordionMode === 'popout'"
                      focusable>
                      <v-expansion-panel-header style="font-weight:bold">{{ currentAllOf.title }}</v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <v-card>
                          <v-card-text>
                            <property
                              :schema="Object.assign({}, currentAllOf, {type: 'object', title: null})"
                              :model-wrapper="subModels"
                              :model-root="modelRoot"
                              :model-key="'allOf-' + i"
                              :parent-key="parentKey"
                              :options="options"
                              @error="e => $emit('error', e)"
                              @change="e => $emit('change', e)"
                              @input="e => $emit('input', e)"
                            />
                          </v-card-text>
                        </v-card>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>
              </template>
              <template v-else>
                <!-- simple objects if we are at first level -->
                <v-col v-for="(currentAllOf, i) in (fullSchema.allOf || [])" :key="i">
                  <property
                    :schema="Object.assign({}, currentAllOf, {type: 'object'})"
                    :model-wrapper="subModels"
                    :model-root="modelRoot"
                    :model-key="'allOf-' + i"
                    :parent-key="parentKey"
                    :options="options"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
                  />
                </v-col>
              </template>
            </template>

            <!-- Sub container with a select for oneOfs -->
            <template v-if="fullSchema.oneOf">
              <v-select
                v-model="currentOneOf"
                :items="fullSchema.oneOf"
                :disabled="disabled"
                :item-value="item => {return oneOfConstProp ? item.properties[oneOfConstProp.key].const : item.title}"
                :label="oneOfConstProp ? (oneOfConstProp.title || oneOfConstProp.key) : 'Type'"
                :required="oneOfRequired"
                :clearable="!oneOfRequired"
                :rules="oneOfRules"
                item-text="title"
                return-object
                @change="change"
                @input="input"
              >
                <v-tooltip v-if="oneOfConstProp && oneOfConstProp.description" slot="append-outer" left>
                  <template #activator="{ on }">
                    <v-icon v-on="{  on }">
                      info
                    </v-icon>
                  </template>
                  <div class="vjsf-tooltip" v-html="oneOfConstProp.htmlDescription" />
                </v-tooltip>
              </v-select>
              <!--{{ currentOneOf }}-->
              <template v-if="currentOneOf && showCurrentOneOf">
                <property
                  :schema="Object.assign({}, currentOneOf, {title: null, type: 'object'})"
                  :model-wrapper="subModels"
                  :model-root="modelRoot"
                  :parent-key="parentKey"
                  :options="options"
                  model-key="currentOneOf"
                  @error="e => $emit('error', e)"
                  @change="e => $emit('change', e)"
                  @input="e => $emit('input', e)"
                />
              </template>
            </template>
          </v-row>
        </v-container>
      </v-slide-y-transition>
    </div>

    <!-- Tuples array sub container -->
    <div v-else-if="fullSchema.type === 'array' && Array.isArray(fullSchema.items)">
      <v-subheader v-if="fullSchema.title" :style="foldable ? 'cursor:pointer;' :'' " class="mt-2" @click="folded = !folded">
        {{ fullSchema.title }}
        &nbsp;
        <v-icon v-if="foldable && folded">
          arrow_drop_down
        </v-icon>
        <v-icon v-if="foldable && !folded">
          arrow_drop_up
        </v-icon>
      </v-subheader>
      <v-slide-y-transition>
        <div v-show="!foldable || !folded">
          <p v-if="fullSchema.description">
            {{ fullSchema.description }}
          </p>
          <property v-for="(child, i) in fullSchema.items" :key="i"
                    :schema="child"
                    :model-wrapper="modelWrapper[modelKey]"
                    :model-root="modelRoot"
                    :model-key="i"
                    :parent-key="fullKey + '.'"
                    :options="options"
                    @error="e => $emit('error', e)"
                    @change="e => $emit('change', e)"
                    @input="e => $emit('input', e)"
          />
        </div>
      </v-slide-y-transition>
    </div>

    <!-- Dynamic size array of complex types sub container -->
    <div v-else-if="fullSchema.type === 'array'">
      <v-row  class="mt-2 mb-1 pr-1">
        <v-subheader>{{ label }}</v-subheader>
        <v-btn v-if="!disabled && !(fromUrl || fullSchema.fromData)" icon color="primary" @click="modelWrapper[modelKey].push(fullSchema.items.default || defaultValue(fullSchema.items)); change(); input()">
          <v-icon>add</v-icon>
        </v-btn>
        <div class="flex-grow-1"></div>
        <v-tooltip v-if="fullSchema.description" left>
          <template #activator="{ on }">
            <v-icon v-on="on">
              info
            </v-icon>
          </template>
          <div class="vjsf-tooltip" v-html="htmlDescription" />
        </v-tooltip>
      </v-row>

      <v-container v-if="modelWrapper[modelKey] && modelWrapper[modelKey].length" class="pt-0 px-2">
        <v-row>
          <draggable v-model="modelWrapper[modelKey]" handle=".handle" style="width: 100%;">
            <v-col v-for="(itemModel, i) in modelWrapper[modelKey]" :key="i" cols="12">
              <v-card class="array-card">
                <v-card-title primary-title class="pa-0">
                  <v-btn v-if="!disabled && fullSchema['x-sortable'] !== false" text icon class="handle">
                    <v-icon>reorder</v-icon>
                  </v-btn>
                  <span v-if="itemTitle && modelWrapper[modelKey][i]">{{ modelWrapper[modelKey][i][itemTitle] }}</span>
                  <div class="flex-grow-1"></div>
                  <v-btn v-if="!disabled && !(fromUrl || fullSchema.fromData)" text icon color="warning" @click="modelWrapper[modelKey].splice(i, 1); change(); input()">
                    <v-icon>delete</v-icon>
                  </v-btn>
                </v-card-title>
                <v-card-text>
                  <property :schema="fullSchema.items"
                            :model-wrapper="modelWrapper[modelKey]"
                            :model-root="modelRoot"
                            :model-key="i"
                            :parent-key="`${fullKey}.`"
                            :options="options"
                            @error="e => $emit('error', e)"
                            @change="e => $emit('change', e)"
                            @input="e => $emit('input', e)"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </draggable>
        </v-row>
      </v-container>
    </div>

    <p v-else-if="options.debug">
      Unsupported type "{{ fullSchema.type }}" - {{ fullSchema }}
    </p>
  </div>
</template>

<script>
import SelectIcon from './SelectIcon.vue'
import schemaUtils from '../utils/schema'
import selectUtils from '../utils/select'
const matchAll = require('match-all')
const md = require('markdown-it')()

export default {
  name: 'Property',
  components: { SelectIcon },
  props: ['schema', 'modelWrapper', 'modelRoot', 'modelKey', 'parentKey', 'required', 'options'],
  data () {
    return {
      ready: false,
      menu: false,
      rawSelectItems: null,
      selectItems: null,
      q: '',
      currentOneOf: null,
      showCurrentOneOf: true,
      fromUrlParams: {},
      loading: false,
      folded: true,
      showColorPicker: false,
      subModels: {} // a container for objects from root oneOfs and allOfs
    }
  },
  computed: {
    fullSchema () {
      return schemaUtils.prepareFullSchema(this.schema, this.modelWrapper, this.modelKey)
    },
    htmlDescription () {
      return (this.fullSchema && this.fullSchema.description) ? md.render(this.fullSchema.description) : null
    },
    fullKey () { return (this.parentKey + this.modelKey).replace('root.', '') },
    label () { return this.fullSchema.title || (typeof this.modelKey === 'string' ? this.modelKey : '') },
    rules () {
      return schemaUtils.getRules(this.fullSchema, this.required, this.options)
    },
    fromUrl () {
      return !!(this.fullSchema['x-fromUrl'] && this.fullSchema['x-fromUrl'].indexOf('{q}') === -1)
    },
    fromUrlWithQuery () {
      return !!(this.fullSchema['x-fromUrl'] && this.fullSchema['x-fromUrl'].indexOf('{q}') !== -1)
    },
    fromUrlKeys () {
      // Look for variable parts in the URL used to fetch data
      if (!this.fullSchema['x-fromUrl']) return null
      return matchAll(this.fullSchema['x-fromUrl'], /\{(.*?)\}/g).toArray().filter(key => key !== 'q')
    },
    itemKey () {
      return this.fullSchema['x-itemKey'] || 'key'
    },
    itemTitle () {
      return this.fullSchema['x-itemTitle'] || 'title'
    },
    itemIcon () {
      return this.fullSchema['x-itemIcon'] || (this.fullSchema['x-display'] === 'icon' ? this.itemKey : null)
    },
    disabled () {
      return this.options.disableAll
    },
    foldable () {
      return this.options.autoFoldObjects && this.parentKey && this.fullSchema.title
    },
    oneOfConstProp () {
      if (!this.fullSchema.oneOf) return
      const props = this.fullSchema.oneOf[0].properties
      const key = Object.keys(props).find(p => !!props[p].const)
      if (!key) return
      return { ...props[key], key, htmlDescription: md.render(props[key].description || '') }
    },
    oneOfRequired () {
      return !!(this.oneOfConstProp && this.fullSchema && this.fullSchema.required && this.fullSchema.required.find(r => r === this.oneOfConstProp.key))
    },
    oneOfRules () {
      const rules = []
      if (this.oneOfRequired) rules.push((val) => (val !== undefined && val !== null && val !== '') || this.options.requiredMessage)
      return rules
    },
    oneOfSelect () {
      return schemaUtils.isOneOfSelect(this.fullSchema)
    }
  },
  watch: {
    q () {
      // This line prevents reloading the list just after selecting an item in an auto-complete
      if (this.modelWrapper[this.modelKey] && this.modelWrapper[this.modelKey][this.itemTitle] === this.q) return
      this.fetchSelectItems()
    },
    fullSchema: {
      handler () {
        if (this.fullSchema && JSON.stringify(this.fullSchema) !== this.lastFullSchema) {
          this.lastFullSchema = JSON.stringify(this.fullSchema)
          // console.log('Schema changed', JSON.stringify(this.fullSchema))
          this.initFromSchema()
          this.cleanUpExtraProperties()
          this.applySubModels()
          this.ready = true
        }
      },
      immediate: true
    },
    currentOneOf () {
      // use this boolean to force removing then re-creating the object property
      // base on the currentOneOf sub schema. If we don't the component is reused and reactivity creates some difficult bugs.
      this.showCurrentOneOf = false
      this.$nextTick(() => {
        this.showCurrentOneOf = true
        if (!this.currentOneOf) this.$set(this.subModels, 'currentOneOf', {})
        this.cleanUpExtraProperties()
      })
    },
    subModels: {
      handler () {
        this.cleanUpExtraProperties()
        this.applySubModels()
      },
      deep: true
    },
    rawSelectItems: {
      handler () {
        this.updateSelectItems()
      },
      immediate: true
    }
  },
  methods: {
    updateSelectItems () {
      const selectItems = selectUtils.getSelectItems(this.rawSelectItems, this.fullSchema, this.modelWrapper, this.modelKey, this.itemKey)
      if (this.fullSchema['x-display'] === 'list') {
        selectUtils.fillList(this.fullSchema, this.modelWrapper, this.modelKey, selectItems, this.itemKey)
      } else {
        selectUtils.fillSelectItems(this.fullSchema, this.modelWrapper, this.modelKey, selectItems, this.itemKey)
      }

      // we check for actual differences in order to prevent infinite loops
      if (JSON.stringify(selectItems) !== JSON.stringify(this.selectItems)) {
        this.selectItems = selectItems
      }
    },
    change () {
      this.updateSelectItems()
      this.$emit('change', { key: this.fullKey.replace(/allOf-([0-9]+)\./g, ''), model: this.modelWrapper[this.modelKey] })
    },
    input () {
      this.$emit('input', { key: this.fullKey.replace(/allOf-([0-9]+)\./g, ''), model: this.modelWrapper[this.modelKey] })
    },
    defaultValue (schema) {
      if (schema.type === 'object' && !schema['x-fromUrl'] && !schema['x-fromData']) return {}
      if (schema.type === 'array') return []
      return null
    },
    fetchSelectItems () {
      if (!this.options.httpLib) return this.$emit('error', 'No http lib found to perform ajax request')
      let url = this.fullSchema['x-fromUrl'].replace('{q}', this.q || '')
      for (let key of this.fromUrlKeys) {
        // URL parameters are incomplete
        if (this.fromUrlParams[key] === undefined) return
        else url = url.replace(`{${key}}`, this.fromUrlParams[key])
      }
      this.loading = true
      this.options.httpLib.get(url)
        .then(res => {
          const body = res.data || res.body
          const items = this.fullSchema['x-itemsProp'] ? body[this.fullSchema['x-itemsProp']] : body
          if (!Array.isArray(items)) throw new Error(`Result of http fetch ${url} is not an array`)
          this.rawSelectItems = items
          this.loading = false
        })
        .catch(err => {
          this.$emit('error', err.message)
          this.loading = false
        })
    },
    cleanUpExtraProperties () {
      // console.log('Cleanup extra properties')
      // cleanup extra properties
      if (this.fullSchema.type === 'object' && this.fullSchema.properties && Object.keys(this.fullSchema.properties).length && this.modelWrapper[this.modelKey]) {
        Object.keys(this.modelWrapper[this.modelKey]).forEach(key => {
          if (!this.fullSchema.properties.find(p => p.key === key)) {
            // console.log(`Remove key ${this.modelKey}.${key}`)
            delete this.modelWrapper[this.modelKey][key]
          }
        })
      }
    },
    applySubModels () {
      // console.log('Apply sub models')
      Object.keys(this.subModels).forEach(subModel => {
        Object.keys(this.subModels[subModel]).forEach(key => {
          if (this.modelWrapper[this.modelKey][key] !== this.subModels[subModel][key]) {
            // console.log(`Apply submodel ${this.modelKey}.${key}`, JSON.stringify(this.subModels[subModel][key]))
            this.$set(this.modelWrapper[this.modelKey], key, this.subModels[subModel][key])
          }
        })
      })
    },
    initFromSchema () {
      // console.log('Init from schema')
      let model = this.modelWrapper[this.modelKey]

      // Manage default values
      if (model === undefined) {
        model = this.defaultValue(this.fullSchema)
        if (this.fullSchema.default !== undefined) model = JSON.parse(JSON.stringify(this.fullSchema.default))
      }

      // const always wins
      if (this.fullSchema.const !== undefined) model = this.fullSchema.const

      // color pickers do not like null values
      if (this.fullSchema.type === 'string' && this.fullSchema.format === 'hexcolor') model = model || ''

      // Case of a select based on ajax query
      if (this.fromUrl) this.fetchSelectItems()
      // Case of select based on an enum
      if ((this.fullSchema.type === 'array' && this.fullSchema.items.enum) || this.fullSchema.enum) {
        this.rawSelectItems = this.fullSchema.type === 'array' ? this.fullSchema.items.enum : this.fullSchema.enum
      }
      // Case of select based on a oneof on simple types
      if (this.oneOfSelect) {
        this.rawSelectItems = (this.fullSchema.type === 'array' ? this.fullSchema.items : this.fullSchema).oneOf.map(item => ({ ...item, [this.itemKey]: item.const || (item.enum && item.enum[0]), [this.itemTitle]: item.title }))
      }
      // Case of an auto-complete field already defined
      if (this.fromUrlWithQuery && model && model[this.itemTitle] !== undefined) {
        this.q = model[this.itemTitle]
      }
      // Case of a select based on an array somewhere in the data
      if (this.fullSchema['x-fromData']) {
        this.$watch('modelRoot.' + this.fullSchema['x-fromData'], (val) => {
          this.rawSelectItems = val
        }, { immediate: true })
      }
      // Watch the dynamic parts of the URL used to fill the select field
      if (this.fromUrlKeys) {
        this.fromUrlKeys.forEach(key => {
          if (key.startsWith('context.')) {
            this.$watch('options.' + key, (val) => {
              this.fromUrlParams[key] = val
              this.fetchSelectItems()
            }, { immediate: true })
          } else {
            this.$watch('modelRoot.' + key, (val) => {
              this.fromUrlParams[key] = val
              this.fetchSelectItems()
            }, { immediate: true })
          }
        })
      }

      // Init subModels for allOf subschemas
      if (this.fullSchema.type === 'object' && this.fullSchema.allOf) {
        this.fullSchema.allOf.forEach((allOf, i) => {
          this.$set(this.subModels, 'allOf-' + i, JSON.parse(JSON.stringify(model)))
        })
      }

      // Case of a sub type selection based on a oneOf
      this.currentOneOf = null
      if (this.fullSchema.type === 'object' && this.fullSchema.oneOf && !this.currentOneOf && this.oneOfConstProp) {
        if (model && model[this.oneOfConstProp.key]) {
          this.currentOneOf = this.fullSchema.oneOf.find(item => item.properties[this.oneOfConstProp.key].const === model[this.oneOfConstProp.key])
        } else if (this.fullSchema.default) {
          this.currentOneOf = this.fullSchema.oneOf.find(item => item.properties[this.oneOfConstProp.key].const === this.fullSchema.default[this.oneOfConstProp.key])
        }
      }

      // Init subModel for current oneOf
      if (this.currentOneOf) {
        this.$set(this.subModels, 'currentOneOf', JSON.parse(JSON.stringify(model)))
      } else {
        this.$set(this.subModels, 'currentOneOf', {})
      }

      // Cleanup arrays of empty items
      if (this.fullSchema.type === 'array') {
        model = model.filter(item => ![undefined, null].includes(item))
      }

      this.$set(this.modelWrapper, this.modelKey, model)
    }
  }
}

</script>

<style lang="css">
.vjsf-property .array-card .v-card__text {
  padding: 6px 16px 0 16px;
}
.vjsf-property .array-card .v-card__actions {
  padding: 0 16px 6px 16px;
}

.vjsf-property .v-input--selection-controls {
  margin-top: 0;
}

.vjsf-tooltip p:last-child {
  margin-bottom: 0;
}

.vjsf-property .color-picker-trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-block;
  border: 2px solid #ccc;
}

.vjsf-property .color-picker-trigger-empty {
  background: linear-gradient(to top right,transparent 0,transparent calc(50% - 2.4px),#de080a 50%,transparent calc(50% + 2.4px),transparent);
}

</style>
