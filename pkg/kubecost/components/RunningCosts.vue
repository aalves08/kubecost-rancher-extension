<script>
import Loading from '@shell/components/Loading';
import LabelValue from '@shell/components/LabelValue';
import { mapGetters } from 'vuex';
import { getKubecostData } from '../utils/kubecostData';

export default {
  name: 'KubecostNamespaceTab',

  components: { Loading, LabelValue },

  props: {
    resource: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    console.log('RESOURCE', this.resource);
    // for cluster dashboard card
    if (this.resource.kind === 'Cluster') {
      this.costs = await getKubecostData({
        aggregate:       'cluster',
        clusterId:       this.clusterId,
        ctx:             this
      });
    } else {
      this.costs = await getKubecostData({
        targetNamespace: this.resource.id,
        clusterId:       this.clusterId,
        ctx:             this
      });
    }
  },

  data() {
    return { costs: undefined };
  },

  watch: {},

  computed: {
    ...mapGetters(['clusterId']),

    errorMsg() {
      if (typeof this.cost === 'string') {
        return this.cost;
      }

      return null;
    }
  },

  methods: {}
};
</script>

<template>
  <div class="main">
    <Loading v-if="$fetchState.pending" mode="relative" />
    <div v-else>
      <h3>{{ t('kubecost.namespaceTab.title') }}</h3>
      <p v-if="errorMsg">
        {{ errorMsg }}
      </p>
      <div
        v-else
        class="label-values"
      >
        <LabelValue
          v-for="cost of costs"
          :key="cost.name"
          class="label-value"
          :name="cost.name"
          :value="cost.value"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  position:'relative';

  .label-values {
    display: flex;
    flex-direction: row;
    .label-value {
      padding-right: 20px;
    }
  }
}
</style>
