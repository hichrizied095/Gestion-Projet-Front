export interface UserDto {
  id: number;
  username: string;
  role: string;
}
export interface ProjectDto {
  id: number;
  title: string;
  description?: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
}
export interface BoardColumnDto {
  id: number;
  name: string;
}

export interface CreateBoardColumnDto {
  name: string;
  projectId: number;
}
export interface TaskItemDto {
  id: number;
  title: string;
  description?: string;
  columnId: number;
  isCompleted: boolean;
  startDate: Date;
  dueDate: Date;
  projectId?: number;
  assignedUserName?: string;
  projectTitle?: string;
  delayReason?: string;
}

export interface CreateTaskItemDto {
  title: string;
  description?: string;
  columnId: number;
  assignedUserId?: number;
  projectId?: number;
}
export interface CommentDto {
  id: number;
  text: string;
  taskId: number;
  createdAt: Date;
  userId: number;
}

export interface CreateCommentDto {
  text: string;
  taskItemId: number;
}
export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}
export interface ProjectDto {
  id: number;
  title: string;
  description?: string;
}
export interface BoardColumnDto {
  id: number;
  name: string;
}

export interface Notification {
  id: number;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;

  // Infos enrichies pour l'affichage
  taskId?: number;
  taskTitle?: string;
  projectId?: number;
  projectTitle?: string;
  type?: 'task' | 'chat';
}

export interface DecisionDto {
  task: string;
  owner: string;
  dueDate: string; // ISO string
}


export interface MeetingDto {
  id: number;
  meetingDate: string;
   startTime: string;      // ← NOUVEAU
  endTime: string;        // ← NOUVEAU
  durationMinutes: number; // ← NOUVEAU

  projectId: number;
   projectTitle: string;
  attendees: {
    id: number;
    username: string;
  }[];

  decisions: {
    id?: number;
    task: string;
    owner: string;
    dueDate: string;
  }[];
}

export interface CreateMeetingDto {
  projectId: number;
  meetingDate: string;
  startTime: string;      // ← NOUVEAU
  endTime: string;        // ← NOUVEAU
  durationMinutes: number; // ← NOUVEAU
  attendeesIds: number[];
  taskItemIds: number[];
}

export interface CommentDto {
  id: number;
  text: string;
  username: string;
  createdAt: Date;
}
