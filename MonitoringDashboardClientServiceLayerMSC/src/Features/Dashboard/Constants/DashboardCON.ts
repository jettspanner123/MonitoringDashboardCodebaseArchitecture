import type { LucideIcon } from 'lucide-react';
import { KeyRound, Radio, FileText, Database, ListOrdered } from 'lucide-react';

export interface RunSmokeTestEnvironmentOption {
  value: string;
  label: string;
}

export interface RunSmokeTestItemDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default class DashboardCON {
  public static readonly TITLE: string = 'Morning Monitoring';
  public static readonly SUBTITLE: string =
    'Automated daily smoke tests across 3DEXPERIENCE and 3DSpace — tracking authentication, page load, indexing, and queue health.';

  // Dummy placeholder environments for the Run Smoke Test modal — not wired to any
  // real environment-targeting capability yet.
  public static readonly RUN_SMOKE_TEST_ENVIRONMENTS: RunSmokeTestEnvironmentOption[] = [
    { value: 'QA', label: 'QA' },
    { value: 'Dev1', label: 'Dev1' },
    { value: 'Dev3', label: 'Dev3' },
    { value: 'PROD', label: 'PROD' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Training', label: 'Training' },
  ];

  // The suite of checks the morning smoke test automation actually performs, shown in
  // the Run Smoke Test modal so the user knows what will be exercised.
  public static readonly RUN_SMOKE_TEST_ITEMS: RunSmokeTestItemDef[] = [
    { id: 'authentication-login', label: 'Authentication Login Test', icon: KeyRound },
    { id: 'authentication-ping', label: 'Authentication Ping Test', icon: Radio },
    { id: 'page-load', label: 'Page Load Test', icon: FileText },
    { id: 'indexing-freshness', label: 'Indexing Freshness Test', icon: Database },
    { id: 'queue-status', label: 'Queue Status Test', icon: ListOrdered },
  ];

  public static readonly AUTHENTICATION_LOGIN_TEST_ID: string = 'authentication-login';
}
