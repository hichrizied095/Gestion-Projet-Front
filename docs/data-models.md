# Data Models

Based on `src/app/Models.ts` and service usage.

## Users & Auth
| Interface | Description |
|-----------|-------------|
| `UserDto` | Public user profile (`id`, `username`, `role`) |
| `LoginDto` | Credentials for login (`username`, `password`) |
| `RegisterDto` | Data for registration (`username`, `password`) |

## Projects & Boards
| Interface | Description |
|-----------|-------------|
| `ProjectDto` | Project summary (`id`, `title`, `description`) |
| `CreateProjectDto` | Payload to create project |
| `BoardColumnDto` | Kanban column definition (`id`, `name`) |
| `CreateBoardColumnDto` | Payload to add column to project |

## Tasks
| Interface | Description |
|-----------|-------------|
| `TaskItemDto` | Basic task info list view |
| `TaskItem` | Full task model including state (`isCompleted`, `progress`, `startDate`, `dueDate`) |
| `CreateTaskItemDto` | Payload to create task |
| `TaskItemDetails` | Detailed view including attachments and comments |
| `TaskAttachment` | File attachment metadata (`name`, `url`, `size`) |

## Collaboration
| Interface | Description |
|-----------|-------------|
| `CommentDto` | Task comments (`text`, `username`, `createdAt`) |
| `CreateCommentDto` | Payload to add comment |
| `Notification` | System notifications (`message`, `isRead`, `type`, `link`) |

## Meetings
| Interface | Description |
|-----------|-------------|
| `MeetingDto` | Meeting details (`meetingDate`, `startTime`, `endTime`, `attendees`, `decisions`) |
| `CreateMeetingDto` | Payload to schedule meeting |
| `DecisionDto` | Outcomes recorded in meetings (`task`, `owner`, `dueDate`) |
