import React, { useEffect, useState } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import ApplicationRouteCON from '../Constants/ApplicationRouteCON';
import ApplicationThemeUtility from '../Utilities/ApplicationThemeUtility';
import ApplicationGradientUtility from '../Utilities/ApplicationGradientUtility';
import TanstackQueryClientService from '../Services/TanstackQueryClientService';
import NavigationController from '../Features/Navigation/NavigationController';
import DashboardOverviewScreenRoute from '../Routes/DashboardOverviewScreenRoute';
import RunDetailScreenRoute from '../Routes/RunDetailScreenRoute';
import { DEFAULT_ENVIRONMENT_VALUE } from '../Features/Dashboard/Constants/DashboardCON';

// ==========================================
// 1. Root Route & Theme Shell
// ==========================================
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Mirrors AssetSphere's own pattern: the "selected entity" is a search param
// on one route, not a dynamic `$param` path segment — this is what AssetSphere
// itself does for every entity-detail view (e.g. `selectedAssetId`), since a
// path param sourced from a CON string constant loses the literal type
// TanStack Router needs to infer params at compile time.
interface DashboardSearchParams {
  [ApplicationRouteCON.PARAM_RUN_ID]?: string;
  [ApplicationRouteCON.PARAM_ENVIRONMENT]?: string;
}

function RootLayout(): React.JSX.Element {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    const saved = ApplicationThemeUtility.current.getSavedTheme();
    ApplicationThemeUtility.current.applyTheme(saved);
    return saved;
  });

  useEffect(() => {
    ApplicationThemeUtility.current.applyTheme(currentTheme);
  }, [currentTheme]);

  const handleToggleTheme = (): void => {
    const next = ApplicationThemeUtility.current.toggleTheme(currentTheme);
    setCurrentTheme(next);
  };

  const [gradientsEnabled, setGradientsEnabled] = useState<boolean>(() => {
    const saved = ApplicationGradientUtility.current.getSavedPreference();
    ApplicationGradientUtility.current.applyPreference(saved);
    return saved;
  });

  useEffect(() => {
    ApplicationGradientUtility.current.applyPreference(gradientsEnabled);
  }, [gradientsEnabled]);

  const handleToggleGradients = (): void => {
    const next = ApplicationGradientUtility.current.togglePreference(gradientsEnabled);
    setGradientsEnabled(next);
  };

  const handleNavigateHome = (): void => {
    navigate({
      to: '.',
      search: (prev: DashboardSearchParams) => ({ ...prev, [ApplicationRouteCON.PARAM_RUN_ID]: undefined }),
    });
  };

  return (
    <NavigationController
      currentTheme={currentTheme}
      onToggleTheme={handleToggleTheme}
      gradientsEnabled={gradientsEnabled}
      onToggleGradients={handleToggleGradients}
      onNavigateHome={handleNavigateHome}
    >
      <Outlet />
    </NavigationController>
  );
}

// ==========================================
// 2. Single Route: Runs Overview <-> Run Detail
// ==========================================
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ApplicationRouteCON.ROOT,
  validateSearch: (rawSearch: Record<string, unknown>): DashboardSearchParams => ({
    [ApplicationRouteCON.PARAM_RUN_ID]:
      typeof rawSearch[ApplicationRouteCON.PARAM_RUN_ID] === 'string'
        ? (rawSearch[ApplicationRouteCON.PARAM_RUN_ID] as string)
        : undefined,
    [ApplicationRouteCON.PARAM_ENVIRONMENT]:
      typeof rawSearch[ApplicationRouteCON.PARAM_ENVIRONMENT] === 'string'
        ? (rawSearch[ApplicationRouteCON.PARAM_ENVIRONMENT] as string)
        : undefined,
  }),
  component: function DashboardRouteComponent() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as DashboardSearchParams;
    const selectedRunId = search[ApplicationRouteCON.PARAM_RUN_ID];
    const selectedEnvironment = search[ApplicationRouteCON.PARAM_ENVIRONMENT] ?? DEFAULT_ENVIRONMENT_VALUE;

    const {
      data: runs = [],
      isLoading: isLoadingRuns,
      isFetching: isRefetchingRuns,
      refetch: refetchRuns,
    } = TanstackQueryClientService.current.runs.useRunsQuery(selectedEnvironment);
    const { data: run, isLoading: isLoadingRun } = TanstackQueryClientService.current.runs.useRunDetailQuery(
      selectedRunId ?? ''
    );

    if (selectedRunId) {
      return (
        <RunDetailScreenRoute
          run={run}
          isLoading={isLoadingRun}
          onBack={() =>
            navigate({
              to: '.',
              search: (prev: DashboardSearchParams) => ({ ...prev, [ApplicationRouteCON.PARAM_RUN_ID]: undefined }),
            })
          }
        />
      );
    }

    return (
      <DashboardOverviewScreenRoute
        runs={runs}
        isLoading={isLoadingRuns}
        isRefetching={isRefetchingRuns}
        onRefetch={() => void refetchRuns()}
        environment={selectedEnvironment}
        onEnvironmentChange={(nextEnvironment) =>
          navigate({
            to: '.',
            search: (prev: DashboardSearchParams) => ({
              ...prev,
              [ApplicationRouteCON.PARAM_ENVIRONMENT]:
                nextEnvironment === DEFAULT_ENVIRONMENT_VALUE ? undefined : nextEnvironment,
            }),
          })
        }
        onSelectRun={(selected) =>
          navigate({
            to: '.',
            search: (prev: DashboardSearchParams) => ({ ...prev, [ApplicationRouteCON.PARAM_RUN_ID]: selected.id }),
          })
        }
      />
    );
  },
});

// ==========================================
// 3. Router Tree
// ==========================================
const routeTree = rootRoute.addChildren([dashboardRoute]);

export const applicationRouter = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof applicationRouter;
  }
}

export default function ApplicationRouter(): React.JSX.Element {
  return <RouterProvider router={applicationRouter} />;
}
