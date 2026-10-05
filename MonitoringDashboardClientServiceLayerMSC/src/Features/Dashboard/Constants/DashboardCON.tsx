import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { KeyRound, Radio, FileText, Database, ListOrdered, Rocket, ClipboardCheck, FlaskConical, GraduationCap, Code2 } from 'lucide-react';

export interface RunSmokeTestEnvironmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
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

  // The default environment shown/selected on first load (no ?environment=
  // in the URL yet).
  public static readonly DEFAULT_ENVIRONMENT_VALUE = 'PRODUCTION';

  private static readonly ENV_ICON_CLASS = 'w-3.5 h-3.5 text-slate-500 dark:text-zinc-400';

  // The canonical six environments MorningSmokeTestAutomation can run
  // against - matches Prisma's Environment enum exactly (schema.prisma),
  // so these values can be sent straight through as the ?environment=
  // query param with no translation layer in between. Used both by the
  // Today's Test tab's real environment filter and the (still
  // non-functional) Run Smoke Test modal.
  public static readonly ENVIRONMENTS: RunSmokeTestEnvironmentOption[] = [
    { value: 'PRODUCTION', label: 'Production', icon: <Rocket className={DashboardCON.ENV_ICON_CLASS} /> },
    { value: 'QA', label: 'QA', icon: <ClipboardCheck className={DashboardCON.ENV_ICON_CLASS} /> },
    { value: 'TESTING', label: 'Testing', icon: <FlaskConical className={DashboardCON.ENV_ICON_CLASS} /> },
    { value: 'TRAINING', label: 'Training', icon: <GraduationCap className={DashboardCON.ENV_ICON_CLASS} /> },
    { value: 'DEV1', label: 'Dev1', icon: <Code2 className={DashboardCON.ENV_ICON_CLASS} /> },
    { value: 'DEV2', label: 'Dev2', icon: <Code2 className={DashboardCON.ENV_ICON_CLASS} /> },
  ];

  public static readonly RUN_SMOKE_TEST_ENVIRONMENTS: RunSmokeTestEnvironmentOption[] = DashboardCON.ENVIRONMENTS;

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
