# Source Tree Analysis: GestionProjet

## Directory Structure

```
d:/Projet/GestionProjet/
├── src/
│   ├── app/
│   │   ├── components/       # Reusable UI components (Modals, Chat, Navbar)
│   │   │   ├── add-task-modal/
│   │   │   ├── chat/
│   │   │   ├── confirm-delete-modal/
│   │   │   ├── confirm-dialog/
│   │   │   ├── gantt-chart/
│   │   │   ├── gantt-modal/
│   │   │   ├── meeting-create/
│   │   │   ├── meeting-details/
│   │   │   ├── meeting-list/
│   │   │   ├── navbar/
│   │   │   ├── stat-card/
│   │   │   └── task-details-modal/
│   │   ├── guards/           # Route protection (AuthGuard, AdminGuard)
│   │   ├── interceptors/     # HTTP Interceptors (JwtInterceptor)
│   │   ├── pages/            # Main application views/routes
│   │   │   ├── admin-dashboard/
│   │   │   ├── calendar/
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── my-tasks/
│   │   │   ├── project-columns/
│   │   │   ├── projects/
│   │   │   ├── register/
│   │   │   ├── user-create/
│   │   │   ├── user-management/
│   │   │   └── user-tasks/
│   │   ├── services/         # API communication layer
│   │   ├── Models.ts         # TypeScript interfaces/types
│   │   ├── app-routing.module.ts # Route definitions
│   │   └── app.module.ts     # Root module configuration
│   ├── assets/               # Static assets
│   ├── index.html            # Application entry point
│   ├── main.ts               # Bootstrapping logic
│   └── styles.css            # Global styles
├── angular.json              # Workspace configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Critical Directories & Files

### `src/app/pages/`
Contains the main functional views of the application. Each folder typically corresponds to a route.
- **`projects/` & `project-columns/`**: Core project management interfaces.
- **`admin-dashboard/` & `user-management/`**: Administrative features.

### `src/app/services/`
Handles all HTTP communication with the backend API.
- **`auth.service.ts`**: Manages authentication state (Observables).
- **`task-item.service.ts`**: Handles task CRUD, file uploads, and assignments.

### `src/app/components/`
Shared UI elements used across pages.
- **`modals`**: Task creation/editing details are handled via modals.
- **`gantt-chart` & `chat`**: Specialized feature components.

### `src/app/guards/`
Security layer preventing unauthorized access.
- `auth.guard.ts`: Protects authenticated routes.
- `admin.guard.ts`: Restricts access to admin-only pages.
