<script>
import Loading from '@shell/components/Loading';
import LabelValue from '@shell/components/LabelValue';
import { mapGetters } from 'vuex';
import { getKubecostData } from '../utils/kubecostModule';

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
    if (this.resource.kind === 'Cluster') {
      // for cluster dashboard card
      this.costs = await getKubecostData({
        aggregate: 'cluster',
        window:    '1d',
        clusterId: this.clusterId,
        ctx:       this
      });
    } else {
      // namespace tab
      this.costs = await getKubecostData({
        aggregate:       'namespace',
        window:          '1d',
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

    info() {
      if (this.costs?.type && this.costs?.msg) {
        return this.costs;
      }

      return null;
    }
  },

  methods: {}
};
</script>

<template>
  <div class="main">
    <Loading
      v-if="$fetchState.pending"
      mode="relative"
    />
    <div v-else>
      <h3 class="mb-40">
        {{ t('kubecost.title') }}
      </h3>
      <h4
        v-if="info"
        :class="`text-${ info.type }`"
      >
        {{ info.msg }}
      </h4>
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
