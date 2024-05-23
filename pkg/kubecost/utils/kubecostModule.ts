import { CATALOG } from '@shell/config/types';

interface kubecostDataItem {
  name: string;
  value: string;
}

type kubecostData = kubecostDataItem[];

interface kubecostDataOptions {
  targetNamespace?: string;
  clusterId: string;
  namespace?: string;
  aggregate?: string;
  window?: string;
  ctx:any;
}

interface kubecostMsg {
  type: string,
  msg: string
}

async function isKubecostInstalled(ctx: any):Promise<any> {
  if (ctx.$store.getters[`cluster/canList`](CATALOG.APP)) {
    const res = await ctx.$store.dispatch(`cluster/findAll`, { type: CATALOG.APP }) || [];
    const app = res.find((app: any) => app.id.includes('kubecost'));

    return app;
  }

  return null;
}

export async function getKubecostData(options:kubecostDataOptions):Promise<kubecostData | kubecostMsg> {
  const kubecostApp = await isKubecostInstalled(options.ctx);

  if (!kubecostApp) {
    return {
      type: 'error',
      msg:  options.ctx.t('kubecost.appNotInstalled')
    };
  }

  const targetNamespace = options.targetNamespace;
  const prefix = `/k8s/clusters/${ options.clusterId }`;
  const namespace = kubecostApp.metadata?.namespace || 'kubecost';
  const service = 'http:kubecost-cost-analyzer:9090'; // hardcoded for now...

  const path = `model/allocation?window=${ options.window || '1d' }&aggregate=${ options.aggregate || 'namespace' }&accumulate=true&chartType=costovertime&costUnit=cumulative&external=false&filter=&idle=true&idleByNode=false&includeSharedCostBreakdown=false&shareCost=0&shareIdle=false&shareLabels=&shareNamespaces=&shareSplit=weighted&shareTenancyCosts=false`;
  const url = `${ prefix }/api/v1/namespaces/${ namespace }/services/${ service }/proxy/${ path }`;

  const res = await options.ctx.$store.dispatch('cluster/request', { url, redirectUnauthorized: false });

  if (res.code === 200) {
    const model = res.data?.[0][targetNamespace || 'cluster-one'];

    if (model) {
      const costs = {
        cpuCost:     model.cpuCost.toFixed(2),
        ramCost:     model.ramCost.toFixed(2),
        pvCost:      model.pvCost.toFixed(2),
        gpuCost:     model.gpuCost.toFixed(2),
        networkCost: model.networkCost.toFixed(2),
        lbCost:      model.loadBalancerCost.toFixed(2),
        totalCost:   model.totalCost.toFixed(2)
      };

      const costsData = Object.entries(costs).map(([key, value]) => ({ name: options.ctx.t(`kubecost.costs.${ key }`), value: `$${ value }` }));

      return costsData;
    } else {
      return {
        type: 'info',
        msg:  options.ctx.t('kubecost.noDataAvailable')
      };
    }
  }

  return {
    type: 'error',
    msg:  res.message
  };
}
