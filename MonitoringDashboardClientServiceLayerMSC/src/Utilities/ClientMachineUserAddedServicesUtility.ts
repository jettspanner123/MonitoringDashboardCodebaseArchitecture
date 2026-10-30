class ClientMachineUserAddedServicesCON {
  public static readonly STORAGE_KEY = 'client_machine_user_added_services';
}

// Frontend-only "track this service too" list, keyed by machineId - never
// written to MD_ConfigurationConstantTBL (that table stays admin-seeded
// only, per the PRD). Lives in localStorage so it survives reloads for this
// browser, but isn't shared with anyone else or persisted server-side.
export default class ClientMachineUserAddedServicesUtility {
  public static current = new ClientMachineUserAddedServicesUtility();

  private readAll(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(ClientMachineUserAddedServicesCON.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  }

  private writeAll(data: Record<string, string[]>): void {
    try {
      localStorage.setItem(ClientMachineUserAddedServicesCON.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage access errors.
    }
  }

  public getForMachine(machineId: string): string[] {
    return this.readAll()[machineId] ?? [];
  }

  public add(machineId: string, serviceName: string): void {
    const all = this.readAll();
    const existing = all[machineId] ?? [];
    if (existing.includes(serviceName)) return;
    all[machineId] = [...existing, serviceName];
    this.writeAll(all);
  }
}
