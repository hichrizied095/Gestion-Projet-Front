# API Contracts

Base URL: `http://localhost:5279/api`

## Auth Service
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| POST | `/Auth/register` | Register new user | `{ username, password, role }` |
| POST | `/Auth/login` | Login user | `{ username, password }` |

## Projects Service
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| GET | `/Projects` | Get all projects | - |
| POST | `/Projects` | Create project | `{ title, description }` |
| DELETE | `/Projects/{id}` | Delete project | - |

## Task Items Service
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| GET | `/TaskItems` | Get all tasks | - |
| GET | `/TaskItems/by-column/{id}` | Get tasks in column | - |
| POST | `/TaskItems` | Create task | `Partial<TaskItem>` |
| PUT | `/TaskItems/{id}` | Update task | `TaskItem` |
| DELETE | `/TaskItems/{id}` | Delete task | - |
| GET | `/TaskItems/{id}/details` | Get full task details | - |
| POST | `/TaskItems/{id}/upload` | Upload attachment | `FormData` |
| POST | `/TaskItems/{id}/delay-reason` | Set task delay reason | `{ reason }` |
| GET | `/TaskItems/by-user/{username}` | Get user's tasks | - |
| GET | `/TaskItems/by-project/{id}` | Get project tasks | - |

## Comments & Others
| Method | Endpoint | Description | Payload |
|--------|----------|-------------|---------|
| GET | `/Comments/by-task/{id}` | Get task comments | - |
