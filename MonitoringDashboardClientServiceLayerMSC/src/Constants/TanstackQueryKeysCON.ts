export default class TanstackQueryKeysCON {
  public static runs(environment?: string): string[] {
    return environment ? ['runs', environment] : ['runs'];
  }

  public static runDetail(runId: string): string[] {
    return ['runs', 'detail', runId];
  }

  public static applications(): string[] {
    return ['application-monitor', 'applications'];
  }

  public static clientMachineRelayStatus(): string[] {
    return ['client-machine-services', 'relay-status'];
  }

  public static clientMachines(): string[] {
    return ['client-machine-services', 'machines'];
  }

  public static clientMachineCuratedServices(machineId: string): string[] {
    return ['client-machine-services', 'machines', machineId, 'services', 'curated'];
  }

  public static clientMachineAllServices(machineId: string): string[] {
    return ['client-machine-services', 'machines', machineId, 'services', 'all'];
  }
}
