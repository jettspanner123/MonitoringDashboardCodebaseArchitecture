# Monitoring Dashboard Client Coding Style & Architecture Specification

> **Version**: 2.0.0 (Enterprise Client Edition)  
> **Target Package**: `MonitoringDashboardClientServiceLayerMSC`  
> **Provenance**: Adapted from AssetSphere's canonical client architecture (the source-of-truth pattern shared across the AssetSphere/SignForge application family), so this dashboard's codebase follows the same conventions as its siblings.

---

## 1. Architectural Philosophy: The MSC (Model-Service-Controller) Pattern

Monitoring Dashboard enforces a strict, modular **Model-Service-Controller (MSC)** architecture across the React 19 + TypeScript frontend. Every component, service, constant, and utility operates under explicit layer boundaries to ensure complete code splitting, zero circular dependencies, and deterministic behavior.

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   │   ROUTER LAYER (src/Router/ & src/Routes/*ScreenRoute.tsx)             │
   │   • Route definitions, access guards, URL parameters                   │
   │                               │                                        │
   │                               ▼                                        │
   │   CONTROLLER LAYER (src/Features/*/ & *ModalController.tsx)            │
   │   • Screen state, form validation, event handling, view orchestration │
   │                               │                                        │
   │                               ▼                                        │
   │   SERVICE LAYER (src/Services/ & src/Features/*/Services/)             │
   │   • Singleton classes (ClassName.current), HTTP APIs, TanStack Query   │
   │                               │                                        │
   │                               ▼                                        │
   │   MODEL & TYPE LAYER (src/Types/*Type.ts & DTOs)                       │
   │   • Pure TypeScript interfaces, enums, discriminated unions            │
   │                                                                        │
   │   SHARED COMPONENT LAYER (src/Shared/Components/*SharedComponent.tsx)  │
   │   • Pure reusable presentation controls, buttons, modals, dropdowns    │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Topology & Folder Hierarchy

All client codebase files reside inside `MonitoringDashboardClientServiceLayerMSC/src/` structured strictly as follows:

```
MonitoringDashboardClientServiceLayerMSC/src/
├── Configurations/             # Network endpoints, environment configurations
│   └── ApplicationNetworkAPIConfiguration.ts
├── Constants/                  # Global application constants (ending in *CON.ts)
│   ├── ApplicationRouteCON.ts
│   ├── ApplicationThemeCON.ts
│   └── TanstackQueryKeysCON.ts
├── Features/                   # Feature modules (Domain-driven vertical slices)
│   ├── AssetDetail/
│   │   └── AssetDetailModalController.tsx
│   ├── AssetInventory/
│   │   ├── AssetInventoryScreenController.tsx
│   │   ├── Components/         # Feature-specific sub-controllers & modals
│   │   │   └── AssetTemplateSelectionModalController.tsx
│   │   └── Services/           # Feature-specific API communication services
│   │       └── AssetInventoryService.ts
│   ├── Employees/
│   │   ├── EmployeesScreenController.tsx
│   │   ├── Components/
│   │   │   ├── EmployeeDetailModalController.tsx
│   │   │   └── EmployeeFormModalController.tsx
│   │   └── Services/
│   │       └── EmployeesDirectoryService.ts
│   └── SoftwareLicenses/
│       ├── SoftwareLicensesScreenController.tsx
│       ├── Components/
│       │   ├── SoftwareLicenseDetailModalController.tsx
│       │   └── SoftwareLicenseFormModalController.tsx
│       └── Services/
│           └── SoftwareLicensesService.ts
├── Models/                     # Isolated Models, Enums, Interfaces, and Type definitions
│   ├── [Name]EnumModel.ts      # One Enum per file (*EnumModel.ts)
│   ├── [Name]InterfaceModel.ts # One Interface per file (*InterfaceModel.ts)
│   └── [Name]TypeModel.ts      # One Type alias per file (*TypeModel.ts)
├── Routes/                     # Screen route wrappers (ending in *ScreenRoute.tsx)
│   ├── AssetInventoryScreenRoute.tsx
│   ├── EmployeesScreenRoute.tsx
│   └── SoftwareLicensesScreenRoute.tsx
├── Router/                     # Central application router & navigation shells
│   └── ApplicationRouter.tsx
├── Services/                   # Global cross-cutting singleton services
│   ├── ApplicationPermissionService.ts
│   ├── ApplicationAudioFeedbackService.ts
│   ├── MockDataSeederService.ts
│   └── TanstackQueryClientService.ts
├── Shared/                     # Reusable design system components (*SharedComponent.tsx)
│   └── Components/
│       ├── AnimatedThemeToggleSharedComponent.tsx
│       ├── BadgeSharedComponent.tsx
│       ├── ButtonSharedComponent.tsx
│       ├── ConfirmationModalSharedComponent.tsx
│       ├── CreatableCustomSelectSharedComponent.tsx
│       ├── CustomSelectSharedComponent.tsx
│       ├── EmptyStateSharedComponent.tsx
│       ├── InputSharedComponent.tsx
│       ├── ModalSharedComponent.tsx
│       ├── PermissionGuardSharedComponent.tsx
│       ├── PrimaryActionButtonSharedComponent.tsx
│       └── ThemeToggleSharedComponent.tsx
├── Store/                      # Global Zustand client reactive state stores
│   └── AuthenticationStateStore.ts
├── Types/                      # Isolated global TypeScript type definitions (*Type.ts)
│   ├── AssetType.ts
│   ├── EmployeeType.ts
│   ├── SoftwareLicenseType.ts
│   ├── UserRoleType.ts
│   └── index.ts                # Central barrel export for all types
└── Utilities/                  # Pure utility singletons (*Utility.ts)
    ├── DateFormatterUtility.ts
    └── OrdinalNumberUtility.ts
```

---

## 3. Strict File & Symbol Naming Invariants

Every file, class, component, and type **MUST** adhere to strict suffix and case rules:

```
┌───────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ Architectural Role        │ File Name Pattern             │ Export Type & Suffix Standard            │
├───────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Screen Controller         │ [Name]ScreenController.tsx    │ export default function [Name]Screen...  │
│ Modal / Dialog Controller │ [Name]ModalController.tsx     │ export default function [Name]Modal...   │
│ Screen Route Wrapper      │ [Name]ScreenRoute.tsx         │ export default function [Name]ScreenRoute│
│ Shared UI Component       │ [Name]SharedComponent.tsx     │ export default function [Name]SharedComp │
│ Constant Class            │ [Name]CON.ts                  │ export default class [Name]CON           │
│ Service Singleton         │ [Name]Service.ts              │ export default class [Name]Service       │
│ Utility Singleton         │ [Name]Utility.ts              │ export default class [Name]Utility       │
│ Enum Model Definition     │ [Name]EnumModel.ts            │ export enum [Name]EnumModel (1 per file) │
│ Interface Model Definition│ [Name]InterfaceModel.ts       │ export interface [Name]InterfaceModel    │
│ Type Model Definition     │ [Name]TypeModel.ts            │ export type [Name]TypeModel              │
│ Type Definition (Legacy)  │ [Name]Type.ts                 │ export interface / type / enum [Name]    │
│ Zustand State Store       │ [Name]Store.ts                │ const use[Name]Store = create(...)       │
└───────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

### Case Conventions
- **PascalCase**: File names, React Components, TypeScript Interfaces, Classes, Types, Enums.
- **camelCase**: Function names, hook names (`useEmployeesQuery`), instance methods, variable names, object properties.
- **UPPER_SNAKE_CASE**: Constant class properties (`ApplicationRouteCON.ASSET_INVENTORY`), localStorage keys (`'MONITORING_DASHBOARD_AUTH_SESSION'`), action types.

---

## 4. Class-Based Singleton Service Architecture

All services, helpers, and utilities (except React functional components and Zustand hooks) **MUST** be defined as classes exposing a public static `current` singleton instance.

```typescript
// 1. Definition (src/Services/ApplicationAudioFeedbackService.ts)
export default class ApplicationAudioFeedbackService {
  public static current = new ApplicationAudioFeedbackService();

  private audioInstance: HTMLAudioElement | null = null;

  public playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioInstance) {
        this.audioInstance = new Audio('/Assets/NotificationSound.mp3');
      }
      this.audioInstance.currentTime = 0;
      this.audioInstance.play().catch(() => {});
    } catch {
      // Audio autoplay policy failsafe
    }
  }
}

// 2. Consumption in Controllers
import ApplicationAudioFeedbackService from '@/src/Services/ApplicationAudioFeedbackService';

ApplicationAudioFeedbackService.current.playNotificationSound();
```

---

## 5. Constant & Configuration Classes (`*CON.ts`)

### Invariant Rules
1. **Zero Magic Strings & Zero Inline Static Arrays**: No static lists of options, tab configurations, route paths, or localStorage key strings may reside inline in component or controller files. They must be declared in a dedicated constant class ending in `*CON.ts`.
2. **ALL CAPS Keys & Storage Values**: Constant properties and their assigned string values for storage keys must be in `ALL_CAPS`.
3. **Class Structure**: Constant classes must declare all properties as `public static readonly`.

```typescript
// Definition (src/Constants/ApplicationRouteCON.ts)
export default class ApplicationRouteCON {
  public static readonly DASHBOARD: string = '/';
  public static readonly ASSET_INVENTORY: string = '/Assets';
  public static readonly EMPLOYEES_DIRECTORY: string = '/employees';
  public static readonly SOFTWARE_LICENSES: string = '/software-saas';
  public static readonly DEVICE_SERVICE_REQUESTS: string = '/service-requests';
  public static readonly LOGIN: string = '/login';
}

// Usage in Router / Controllers
import ApplicationRouteCON from '@/src/Constants/ApplicationRouteCON';

navigate(ApplicationRouteCON.ASSET_INVENTORY);
```

---

## 6. TypeScript & Typing Standards (The Strict Zero-`any` Policy)

### 1. Zero `any` Invariant
The use of `any` is strictly prohibited throughout the codebase. Use exact interfaces, union types, discriminated unions, generic type parameters, or `unknown` with type narrowing.

### 2. Explicit Component Signatures & JSX Return Types
Every React functional component must have:
1. An exported Props interface named `[ComponentName]Props`.
2. An explicit return type of `React.JSX.Element` (or `React.JSX.Element | null`).

```typescript
export interface SoftwareLicenseCardProps {
  license: SoftwareLicense;
  onSelect: (license: SoftwareLicense) => void;
  onDelete?: (id: string) => void;
}

export default function SoftwareLicenseCard({
  license,
  onSelect,
  onDelete,
}: SoftwareLicenseCardProps): React.JSX.Element {
  return (
    <div onClick={() => onSelect(license)}>
      {/* Component content */}
    </div>
  );
}
```

### 3. Isolated Global Type Files (`src/Types/*Type.ts`)
- Every global data model must be declared in its own isolated file in `src/Types/` ending in `*Type.ts` (e.g. `AssetType.ts`, `SoftwareLicenseType.ts`).
- Monolithic `types.ts` files are strictly forbidden.
- All types are re-exported through the central barrel `src/Types/index.ts`.

### 4. Isolated Model Files in `src/Models/` (One Definition Per File Invariant)
- **Zero Raw Strings for State Options / Modes**: Whenever state represents discrete modes, options, tabs, or statuses, TypeScript `enum` models must be used instead of raw string literals or string unions.
- **Strict Single-Definition-Per-File**: Each enum, interface, or type alias must reside in its own isolated file inside `src/Models/`:
  - **Enums**: Must end with `*EnumModel.ts` and declare `export enum [Name]EnumModel` (one enum per file).
  - **Interfaces**: Must end with `*InterfaceModel.ts` and declare `export interface [Name]InterfaceModel` (one interface per file).
  - **Type Aliases / Unions**: Must end with `*TypeModel.ts` and declare `export type [Name]TypeModel` (one type alias per file).
- **Default and Named Export**: Every model file must export its type/enum both as a named export and as the `default` export.

---

## 7. Component Hierarchy & Controller Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SCREEN CONTROLLERS (src/Features/*/[Name]ScreenController.tsx)           │
│    • Serves as the top-level state orchestrator for a primary route.        │
│    • Fetches data via TanStack Query hooks.                                 │
│    • Manages active filters, search text, tab selections, and modal state.  │
│    • Coordinates Create / Edit / Delete modal visibility.                   │
│                                                                             │
│ 2. MODAL CONTROLLERS (src/Features/*/Components/[Name]ModalController.tsx)  │
│    • Encapsulates complete dialog lifecycle, validation, and multi-steps.   │
│    • Manages exitDirection ('down' vs 'up') physics.                        │
│    • Uses lastRef.current data caching to prevent premature unmounting.    │
│    • Executes TanStack Query mutations with optimistic feedback and toasts. │
│                                                                             │
│ 3. SCREEN ROUTES (src/Routes/[Name]ScreenRoute.tsx)                         │
│    • Clean, zero-logic entrypoint wrappers mapped directly in the router.   │
│                                                                             │
│ 4. SHARED COMPONENTS (src/Shared/Components/[Name]SharedComponent.tsx)      │
│    • Pure, highly reusable UI controls adhering to the design system.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. TanStack Query Hub & Client Services Integration

All server state communication is managed via a centralized singleton hub `TanstackQueryClientService.ts` to enforce uniform query caching, retry strategies, and automatic cache invalidation.

```typescript
// 1. Central Query Hub Structure (src/Services/TanstackQueryClientService.ts)
export default class TanstackQueryClientService {
  public static current = new TanstackQueryClientService();

  public readonly softwareLicenses = {
    useSoftwareLicensesQuery: () => {
      return useQuery({
        queryKey: TanstackQueryKeysCON.SOFTWARE_LICENSES,
        queryFn: () => SoftwareLicensesService.current.getLicenses(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      });
    },
    useCreateSoftwareLicenseMutation: (options?: MutationOptions) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (dto: SoftwareLicenseCreateDTO) =>
          SoftwareLicensesService.current.createLicense(dto),
        onSuccess: async (data) => {
          await queryClient.invalidateQueries({
            queryKey: TanstackQueryKeysCON.SOFTWARE_LICENSES,
          });
          options?.onSuccess?.(data);
        },
      });
    },
  };
}

// 2. Consumption in Screen Controllers
const { data: licenses = [], isLoading } =
  TanstackQueryClientService.current.softwareLicenses.useSoftwareLicensesQuery();
```

---

## 9. Zustand Reactive State Stores (`*Store.ts`)

Global client-only reactive state (such as authenticated user session, active permissions, and ephemeral UI configurations) is managed in `src/Store/` using Zustand:

```typescript
// Definition (src/Store/AuthenticationStateStore.ts)
import { create } from 'zustand';
import { UserRoleType } from '@/src/Types';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRoleType;
}

interface AuthenticationStateStoreInterface {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
  clearSession: () => void;
}

const useAuthenticationStateStore = create<AuthenticationStateStoreInterface>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthenticationStateStore;
```

---

## 10. Operational Invariants & Zero-Mock Data Specification

### 1. Pure Data Grounding (Zero Fake / Mock Arrays)
- All rendered cards, table rows, and metrics **MUST** come from active backend API responses.
- Never write hardcoded fallback mock arrays (e.g. `const displayData = data.length > 0 ? data : MOCK_DATA;`) in production controllers.
- When an entity dataset is empty (0 items), render [`EmptyStateSharedComponent.tsx`](file:///c:/Users/UddeshyaSingh/Development/MonitoringDashboardCodebaseArchitecture/MonitoringDashboardClientServiceLayerMSC/src/Shared/Components/EmptyStateSharedComponent.tsx) with a clear explanation and call-to-action.

### 2. Modal Data Caching Ref (Anti-Premature Disappearance)
When a modal receives an entity via props (e.g. `license: SoftwareLicense | null`), it **MUST** maintain a data caching ref so the modal does not instantly vanish while `AnimatePresence` performs its 600ms exit animation:

```tsx
const lastRef = useRef<SoftwareLicense | null>(license);
if (license) lastRef.current = license;
const displayLicense = license || lastRef.current;
```

### 3. Modal Bi-directional Exit Physics
- Header `X` button & top backdrop clicks: `setExitDirection('down')`.
- Footer Cancel / Close / Submit / Action buttons & deep backdrop clicks: `setExitDirection('up')`.

---

## 11. Code Quality & Pre-Generation Checklist

Before delivering or modifying any client code in Monitoring Dashboard, verify that:

- [ ] Component is a functional component with explicit `React.JSX.Element` return type.
- [ ] Component is `export default` with a matching file name and architectural suffix.
- [ ] Props are defined in an exported interface `[ComponentName]Props`.
- [ ] Zero `any` types are used.
- [ ] All constants, routes, and storage keys are referenced from a `*CON.ts` class in `ALL_CAPS`.
- [ ] All service or utility functions are encapsulated in classes with `public static current`.
- [ ] Server data is queried and mutated through `TanstackQueryClientService.current`.
- [ ] Global types are imported from `@/src/Types`.
- [ ] Empty state fallback uses `EmptyStateSharedComponent`.
- [ ] `tsc --noEmit` and Vite build complete with **0 errors**.

---

*Authored and Certified for Monitoring Dashboard App Codebase Architecture.*
