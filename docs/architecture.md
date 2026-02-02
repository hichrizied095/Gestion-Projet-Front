# System Architecture: GestionProjet

## Architectural Pattern
**Frontend Monolith (SPA)** communicating with a **RESTful Backend API**.

The application follows the standard Angular architecture:
1.  **Modules**: Feature-based organization (though currently heavily centralized in `AppModule`).
2.  **Components**: Presentation layer handling UI and user interaction.
3.  **Services**: Data layer handling logic and API communication.
4.  **Guards/Interceptors**: Cross-cutting concerns like Authentication and Authorization.

## Component Architecture
The application is structured around pages that compose smaller, reusable components.

### Core Pages
-   `ProjectsComponent` / `ProjectColumnsComponent`: Main Kanban board interface.
-   `UserTasksComponent` / `MyTasksComponent`: Individual task tracking.
-   `CalendarComponent`: Visual planning view.
-   `GanttChartComponent`: Timeline view.
-   `ChatComponent`: Team communication.

### Shared Components
-   `NavbarComponent`: Top-level navigation.
-   `AddTaskModal`, `TaskDetailsModal`: Dialogs for task management.
-   `ConfirmDialog`, `ConfirmDeleteModal`: Safety checks for destructive actions.

## Data Flow
1.  **User Action** triggers a Component method.
2.  Component delegates to a **Service** (e.g., `TaskItemService`).
3.  Service returns an **Observable**.
4.  Component subscribes to update local state or UI.
5.  **State Management** is primarily handled via RxJS `BehaviorSubject` (e.g., `AuthService.isLoggedIn`) and local component state.

## Integration Architecture
The frontend integrates with the backend via HTTP REST calls.

-   **Base URL**: `http://localhost:5279/api/`
-   **Authentication**: JWT Token sent in `Authorization` header via `JwtInterceptor`.
-   **Real-time**: SignalR connection for chat and live updates (implied from imports).

## Security Architecture
-   **Authentication**: Username/Password login returning JWT.
-   **Authorization**: Role-based (Admin/User).
    -   `AuthGuard`: Protects routes requiring login.
    -   `AdminGuard`: Protects routes requiring 'Admin' role.
-   **Storage**: Token stored in `localStorage` (`token`, `username`).
