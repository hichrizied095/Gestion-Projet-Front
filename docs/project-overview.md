# Project Overview: GestionProjet

## Executive Summary
GestionProjet is a comprehensive Project Management application built with **Angular 19**. It features a Kanban-style task management system, project tracking, user management, real-time chat, and meeting scheduling. The application uses a monolith frontend architecture communicating with a .NET backend API.

## Technology Stack

| Category | Technology | Version | Usage |
|----------|------------|---------|-------|
| **Framework** | Angular | 19.1.0 | Core frontend framework |
| **Styling** | Bootstrap | 5.3.7 | Responsive UI layout |
| **UI Components** | ng-bootstrap | 18.0.0 | Bootstrap components for Angular |
| **Icons** | FontAwesome | 6.7.2 | Iconography |
| **Charting** | Chart.js / ng2-charts | 4.5.1 / 8.0.0 | Dashboard statistics and visualizations |
| **Calendar** | FullCalendar | 6.1.8 | Drag-and-drop calendar interface |
| **Gantt** | frappe-gantt | 1.0.4 | Project timelines (Gantt charts) |
| **Real-time** | SignalR | 9.0.6 | Real-time updates (Chat, Notifications) |
| **State** | RxJS | 7.8.0 | Reactive state management |

## Architecture Type
**Single Page Application (SPA)** following a component-based architecture with service-layer abstraction for API communication.

## Repository Structure
- **Monolith Frontend**: Single Angular application in `src/`
- **Backend**: External .NET Web API (running locally on port 5279)

## Key Features
1. **User Authentication**: JWT-based login/register with Role-Based Access Control (Admin/User).
2. **Project Management**: CRUD operations for projects, columns, and task items.
3. **Task Board**: Kanban view with drag-and-drop support.
4. **Planning Tools**: Interactive Calendar and Gantt Chart views.
5. **Collaboration**: Real-time chat and meeting management.
6. **Dashboard**: Admin statistics and user task tracking.
