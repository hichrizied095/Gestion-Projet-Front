// ==========================================
// USER MODELS
// ==========================================

export interface UserDto {
  id: number;
  username: string;
  role: string;
  isApproved?: boolean;
  
  // ✅ NOUVEAUX CHAMPS - Profil
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  
  // ✅ NOUVEAUX CHAMPS - Activité
  createdAt?: Date;
  lastLoginDate?: Date;
  totalTasksCompleted?: number;
  totalProjectsCreated?: number;
  
  // ✅ NOUVEAUX CHAMPS - Préférences
  preferredLanguage?: string;
  theme?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  
  // ✅ NOUVEAUX CHAMPS - Gestion
  isActive?: boolean;
  updatedAt?: Date;
}

// ✅ NOUVEAU: DTO pour mise à jour du profil
export interface UpdateProfileDto {
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  preferredLanguage?: string;
  theme?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

// ✅ NOUVEAU: DTO pour les statistiques utilisateur
export interface UserStatsDto {
  userId: number;
  username: string;
  totalTasksCompleted: number;
  totalProjectsCreated: number;
  lastLoginDate?: Date;
  createdAt: Date;
  daysSinceCreation: number;
  tasksPerDay: number;
}

export interface LoginDto {
  username: string;  // Accepte email OU username
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  role: string;
  
  // ✅ NOUVEAUX CHAMPS OPTIONNELS
  email?: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
}

// ✅ NOUVEAU: DTO pour changement de mot de passe
export interface ChangePasswordDto {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

// ==========================================
// PROJECT MODELS
// ==========================================

export interface ProjectDto {
  id: number;
  title: string;
  description?: string;
  createdAt?: Date;
  ownerId?: number;
  ownerName?: string;
  
  // ✅ NOUVEAUX: Infos enrichies du propriétaire
  ownerEmail?: string;
  ownerDepartment?: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
}

// ==========================================
// BOARD COLUMN MODELS
// ==========================================

export interface BoardColumnDto {
  id: number;
  name: string;
}

export interface CreateBoardColumnDto {
  name: string;
  projectId: number;
}

// ==========================================
// TASK MODELS
// ==========================================

export interface TaskItemDto {
  id: number;
  title: string;
  description?: string;
  percentage?: number;
  columnId: number;
  isCompleted: boolean;
  startDate: Date;
  dueDate: Date;
  projectId?: number;
  assignedUserId?: number;
  assignedUserName?: string;
  assignedUsername?: string;  // Alias pour compatibilité
  projectTitle?: string;
  delayReason?: string;
  createdAt?: Date;
}

export interface CreateTaskItemDto {
  title: string;
  description?: string;
  columnId: number;
  assignedUserId?: number;
  projectId?: number;
  percentage?: number;
  startDate?: Date;
  dueDate?: Date;
}

export interface UpdateTaskItemDto {
  title?: string;
  description?: string;
  columnId?: number;
  assignedUserId?: number;
  percentage?: number;
  startDate?: Date;
  dueDate?: Date;
  isCompleted?: boolean;
  delayReason?: string;
}

// ==========================================
// COMMENT MODELS
// ==========================================

export interface CommentDto {
  id: number;
  text: string;
  taskId?: number;
  username?: string;
  userId?: number;
  createdAt: Date;
}

export interface CreateCommentDto {
  text: string;
  taskItemId: number;
}

// ==========================================
// NOTIFICATION MODELS
// ==========================================

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
  type?: 'task' | 'chat' | 'meeting' | 'project';
  
  // ✅ NOUVEAU: Info utilisateur associé
  userId?: number;
  userName?: string;
  userProfilePicture?: string;
}

// ==========================================
// MEETING MODELS
// ==========================================

export interface DecisionDto {
  id?: number;
  task: string;
  owner: string;
  dueDate: string; // ISO string
  
  // ✅ NOUVEAUX: Détails complets de la tâche
  taskId?: number;
  taskTitle?: string;
  percentage?: number;
  isCompleted?: boolean;
  columnId?: number;
  description?: string;
  assignedUserId?: number;
}

export interface MeetingAttendeeDto {
  id: number;
  username: string;
  
  // ✅ NOUVEAUX: Infos enrichies
  email?: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
}

export interface MeetingDto {
  id: number;
  meetingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  projectId: number;
  projectTitle?: string;
  
  attendees: MeetingAttendeeDto[];
  
  decisions: DecisionDto[];
  
  // ✅ NOUVEAU: Détails de décisions complets
  decisionsDetails?: {
    taskId: number;
    taskTitle: string;
    owner: string;
    dueDate: string;
    percentage: number;
    isCompleted: boolean;
    columnId: number;
    description?: string;
    assignedUserId?: number;
  }[];
}

export interface CreateMeetingDto {
  projectId: number;
  meetingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendeesIds: number[];
  taskItemIds: number[];
}

// ==========================================
// MESSAGE MODELS (CHAT)
// ==========================================

export interface MessageDto {
  id: number;
  content: string;
  senderId: number;
  senderName?: string;
  senderProfilePicture?: string;
  receiverId: number;
  receiverName?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface CreateMessageDto {
  content: string;
  receiverId: number;
}

// ==========================================
// ATTACHMENT MODELS
// ==========================================

export interface AttachmentDto {
  id: number;
  fileName: string;
  filePath: string;
  uploadedAt: Date;
  fileSize?: number;
  contentType?: string;
}

// ==========================================
// ADMIN DASHBOARD MODELS
// ==========================================

export interface DashboardStatsDto {
  // Utilisateurs
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  activeUsers?: number;
  inactiveUsers?: number;
  roleStats?: { [role: string]: number };
  
  // Projets
  totalProjects: number;
  activeProjects: number;
  
  // Tâches
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayTasks: number;
  
  // Réunions
  upcomingMeetings: number;
  todayMeetings: number;
  
  // Progression
  overallProgress: number;
  completionRate: number;
}

export interface ActivityDto {
  type: 'project_created' | 'task_created' | 'meeting_scheduled' | 'comment_added';
  title: string;
  description: string;
  date: Date;
  status: 'success' | 'pending' | 'completed' | 'past' | 'upcoming' | 'info';
  icon: string;
  userId?: number;
  userName?: string;
  
  // ✅ NOUVEAUX
  userProfilePicture?: string;
  userDepartment?: string;
}

export interface TopPerformerDto {
  id: number;
  username: string;
  email?: string;
  role: string;
  department?: string;
  profilePicture?: string;
  totalTasksCompleted: number;
  totalProjectsCreated: number;
  score: number;
  daysSinceCreation: number;
  productivity: number;
}

// ==========================================
// DELAY REASON MODEL
// ==========================================

export interface DelayReasonDto {
  id: number;
  reason: string;
  taskItemId: number;
  createdAt: Date;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type UserRole = 'Admin' | 'Manager' | 'Member';
export type UserTheme = 'light' | 'dark';
export type UserLanguage = 'fr' | 'en' | 'ar';

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}