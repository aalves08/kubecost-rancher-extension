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

export async function getKubecostData(options:kubecostDataOptions):Promise<kubecostData | string> {
  // Production Note - This does not check if the cluster has kubecost installed. That should be achievable by fetching installed helm
  // apps. This might also reveal which namespace the chart is installed to
  const targetNamespace = options.targetNamespace;
  const prefix = `/k8s/clusters/${ options.clusterId }`;
  const namespace = 'kubecost'; // Production Note - This could be any namespace the user decided to install kubecost to
  const service = 'http:kubecost-cost-analyzer:9090'; // Production Note - Brittle. In theory this could change?
  // const path = `model/allocation?window=${ options.window || '1d' }&aggregate=${ options.aggregate || 'namespace' }&accumulate=true`;

  // &accumulate=day&chartType=costovertime&costUnit=cumulative&external=false&filter=&idle=true&idleByNode=false&includeSharedCostBreakdown=false&shareCost=0&shareIdle=false&shareLabels=&shareNamespaces=&shareSplit=weighted&shareTenancyCosts=false&offset=0&limit=25
  // chartType
  // costUnit
  const path = `model/allocation?window=${ options.window || '1d' }&aggregate=${ options.aggregate || 'namespace' }&accumulate=day&chartType=costovertime&costUnit=cumulative&external=false&filter=&idle=true&idleByNode=false&includeSharedCostBreakdown=false&shareCost=0&shareIdle=false&shareLabels=&shareNamespaces=&shareSplit=weighted&shareTenancyCosts=false`;
  const url = `${ prefix }/api/v1/namespaces/${ namespace }/services/${ service }/proxy/${ path }`;

  const res = await options.ctx.$store.dispatch('cluster/request', { url, redirectUnauthorized: false });

  // Production Note - There's no error handling here
  if (res.code === 200) {
    console.log('DATA!!!!', res.data);
    const model = res.data?.[0][targetNamespace || 'cluster-one'];

    console.log('model', model);

    if (model) {
      const costs = {
        cpuCost:     model.cpuCost.toFixed(2),
        ramCost:     (model.ramCost * (10 ** -9)).toFixed(2),
        pvCost:      model.pvCost.toFixed(2),
        gpuCost:     model.gpuCost.toFixed(2),
        networkCost: model.networkCost.toFixed(2),
        lbCost:      model.loadBalancerCost.toFixed(2),
        totalCost:   (model.totalCost * (10 ** -9)).toFixed(2)
      };

      console.log('COSTS', costs);

      const costsData = Object.entries(costs).map(([key, value]) => ({ name: options.ctx.t(`kubecost.namespaceTab.costs.${ key }`), value: `$${ value }` }));

      console.log('costsData', costsData);

      return costsData;
    } else {
      return 'No data available yet. Wait a few more minutes to gather some data about costs';
    }
  }

  return res.message;
}
