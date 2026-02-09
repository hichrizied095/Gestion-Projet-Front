import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Message, ChatService, UserWithLastMessage } from '../../services/chat.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  conversations: UserWithLastMessage[] = [];
  selectedUser?: UserWithLastMessage;
  messages: Message[] = [];
  newMessage: string = '';
  currentUserId: number | null = null;
  totalUnreadCount: number = 0;
  
  // ✅ NOUVEAU: Photo de profil de l'utilisateur connecté
  currentUserProfilePicture: string | null = null;
  currentUserName: string | null = null;
  
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    public auth: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUserId();
    this.currentUserName = this.auth.getCurrentUsername();
    console.log("👤 currentUserId :", this.currentUserId);

    // ✅ Charger la photo de profil de l'utilisateur connecté
    this.loadCurrentUserProfile();

    // S'abonner au compteur de messages non lus
    this.chatService.unreadCount$.subscribe(count => {
      this.totalUnreadCount = count;
    });

    this.userService.getUsers().subscribe({
      next: (users) => {
        // ✅ Convertir les utilisateurs en conversations (avec photos)
        this.conversations = users
          .filter(u => u.id !== this.currentUserId)
          .map(u => this.userToConversation(u));
        console.log("✅ Conversations :", this.conversations);
      },
      error: (err) => console.error("❌ Erreur utilisateurs :", err)
    });

    if (this.currentUserId) {
      this.chatService.startConnection(this.currentUserId, (msg: any) => {
        if (msg.senderId === this.currentUserId) {
          msg.isRead = false;
        }
        
        this.updateConversations(msg);
        
        const isRelevantMessage = this.selectedUser && (
          (msg.senderId === this.currentUserId && msg.receiverId === this.selectedUser.id) ||
          (msg.senderId === this.selectedUser.id && msg.receiverId === this.currentUserId)
        );
        
        if (isRelevantMessage) {
          const isDuplicate = this.messages.some(m => 
            m.content === msg.content && 
            m.senderId === msg.senderId && 
            m.receiverId === msg.receiverId &&
            Math.abs(new Date(m.sentAt || 0).getTime() - new Date(msg.sentAt || 0).getTime()) < 1000
          );
          
          if (!isDuplicate) {
            this.messages.push({
              ...msg,
              senderName: msg.senderName || (msg.senderId === this.currentUserId ? 'Moi' : this.selectedUser?.username)
            });
            this.shouldScrollToBottom = true;
          }
        }
      });

      this.chatService.onMessagesRead((senderId: number, receiverId: number) => {
        if (senderId === this.currentUserId) {
          this.messages.forEach(msg => {
            if (msg.senderId === this.currentUserId && msg.receiverId === receiverId) {
              msg.isRead = true;
            }
          });
        }
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // ==========================================
  // ✅ NOUVEAU: Charger la photo de profil de l'utilisateur connecté
  // ==========================================
  loadCurrentUserProfile(): void {
    if (this.currentUserId) {
      this.userService.getUserById(this.currentUserId).subscribe({
        next: (user) => {
          this.currentUserProfilePicture = user.profilePicture || null;
        },
        error: (err) => console.error("❌ Erreur chargement profil:", err)
      });
    }
  }

  selectUser(conversation: UserWithLastMessage) {
    this.selectedUser = conversation;

    if (this.currentUserId) {
      this.chatService.getHistory(this.currentUserId, conversation.id).subscribe({
        next: (msgs) => {
          this.chatService.initializeCache(this.currentUserId!, conversation.id, msgs);
          
          this.messages = msgs;
          this.shouldScrollToBottom = true;
          
          this.chatService.markAsRead(this.currentUserId!, conversation.id);
          conversation.unreadCount = 0;
        },
        error: (err) => console.error("❌ Erreur chargement historique :", err)
      });
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser || !this.currentUserId) return;

    const messageContent = this.newMessage;
    
    this.chatService.sendMessage(
      this.currentUserId,
      this.selectedUser.id!,
      messageContent
    );

    this.selectedUser.lastMessage = messageContent;
    this.selectedUser.lastMessageTime = new Date().toISOString();

    this.newMessage = '';
    this.shouldScrollToBottom = true;
  }

  // ==========================================
  // ✅ NOUVEAU: Obtenir les initiales d'un utilisateur
  // ==========================================
  getUserInitials(username: string | undefined): string {
    if (!username) return '?';
    const names = username.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  private userToConversation(user: User): UserWithLastMessage {
    const lastMessage = this.currentUserId 
      ? this.chatService.getLastMessage(this.currentUserId, user.id!)
      : null;
    
    const unreadCount = this.currentUserId
      ? this.chatService.getUnreadCountForUser(this.currentUserId, user.id!)
      : 0;

    return {
      id: user.id!,
      username: user.username,
      profilePicture: user.profilePicture, // ✅ Photo de profil
      lastMessage: lastMessage?.content,
      lastMessageTime: lastMessage?.sentAt,
      unreadCount: unreadCount
    };
  }

  private updateConversations(msg: Message): void {
    const otherUserId = msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId;
    const conversation = this.conversations.find(c => c.id === otherUserId);
    
    if (conversation) {
      conversation.lastMessage = msg.content;
      conversation.lastMessageTime = msg.sentAt;
      
      if (msg.senderId !== this.currentUserId && this.selectedUser?.id !== otherUserId) {
        conversation.unreadCount++;
      }
    }
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Erreur scroll:', err);
    }
  }

  truncateMessage(message: string | undefined, maxLength: number = 50): string {
    if (!message) return 'Aucun message';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  }
}