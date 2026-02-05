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
  
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  private shouldScrollToBottom = false;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUserId();
    console.log("👤 currentUserId :", this.currentUserId);

    // ✅ S'abonner au compteur de messages non lus
    this.chatService.unreadCount$.subscribe(count => {
      this.totalUnreadCount = count;
    });

    this.userService.getUsers().subscribe({
      next: (users) => {
        // ✅ Convertir les utilisateurs en conversations
        this.conversations = users
          .filter(u => u.id !== this.currentUserId)
          .map(u => this.userToConversation(u));
        console.log("✅ Conversations :", this.conversations);
      },
      error: (err) => console.error("❌ Erreur utilisateurs :", err)
    });


    if (this.currentUserId) {
      this.chatService.startConnection(this.currentUserId, (msg: any) => {
        // ✅ CORRECTION: Les messages envoyés par moi sont NON lus jusqu'à ce que le destinataire les lise
        // Seuls les messages REÇUS peuvent être marqués comme lus quand j'ouvre la conversation
        if (msg.senderId === this.currentUserId) {
          msg.isRead = false; // ✅ Mes messages envoyés sont "non lus" par défaut
        }
        
        // ✅ Mettre à jour les conversations avec le nouveau message
        this.updateConversations(msg);
        
        // ✅ Vérifier si le message concerne la conversation active
        const isRelevantMessage = this.selectedUser && (
          (msg.senderId === this.currentUserId && msg.receiverId === this.selectedUser.id) ||
          (msg.senderId === this.selectedUser.id && msg.receiverId === this.currentUserId)
        );
        
        if (isRelevantMessage) {
          // ✅ Vérifier qu'on n'a pas déjà ce message (éviter les doublons)
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

      // ✅ NOUVEAU: Écouter les notifications de lecture
      this.chatService.onMessagesRead((senderId: number, receiverId: number) => {
        // Si quelqu'un a lu mes messages
        if (senderId === this.currentUserId) {
          // Marquer tous mes messages envoyés à cette personne comme lus
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

  selectUser(conversation: UserWithLastMessage) {
    this.selectedUser = conversation;

    if (this.currentUserId) {
      this.chatService.getHistory(this.currentUserId, conversation.id).subscribe({
        next: (msgs) => {
          // ✅ Initialiser le cache avec l'historique
          this.chatService.initializeCache(this.currentUserId!, conversation.id, msgs);
          
          this.messages = msgs;
          this.shouldScrollToBottom = true;
          
          // ✅ Marquer les messages comme lus
          this.chatService.markAsRead(this.currentUserId!, conversation.id);
          
          // ⚠️ DÉSACTIVÉ: Notifier l'expéditeur que j'ai lu ses messages
          // TODO: Activer quand le backend supportera NotifyMessagesRead
          // this.chatService.notifyMessagesRead(this.currentUserId!, conversation.id);
          
          // ✅ Mettre à jour le compteur de messages non lus pour cette conversation
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

    // ✅ NE PAS ajouter le message localement - il sera reçu via SignalR
    // Cela évite les doublons
    
    // ✅ Mettre à jour le dernier message dans la conversation
    this.selectedUser.lastMessage = messageContent;
    this.selectedUser.lastMessageTime = new Date().toISOString();

    this.newMessage = '';
    this.shouldScrollToBottom = true;
  }

  // ✅ NOUVEAU: Convertir un User en UserWithLastMessage
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
      lastMessage: lastMessage?.content,
      lastMessageTime: lastMessage?.sentAt,
      unreadCount: unreadCount
    };
  }

  // ✅ NOUVEAU: Mettre à jour les conversations après réception d'un message
  private updateConversations(msg: Message): void {
    const otherUserId = msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId;
    const conversation = this.conversations.find(c => c.id === otherUserId);
    
    if (conversation) {
      conversation.lastMessage = msg.content;
      conversation.lastMessageTime = msg.sentAt;
      
      // ✅ Incrémenter le compteur si le message n'est pas de moi et que ce n'est pas la conversation active
      if (msg.senderId !== this.currentUserId && this.selectedUser?.id !== otherUserId) {
        conversation.unreadCount++;
      }
    }
  }

  // ✅ NOUVEAU: Scroller vers le bas
  private scrollToBottom(): void {
    try {
      // ✅ Utiliser setTimeout pour garantir que le DOM est mis à jour
      setTimeout(() => {
        if (this.messagesContainer) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Erreur scroll:', err);
    }
  }

  // ✅ NOUVEAU: Tronquer le texte du dernier message
  truncateMessage(message: string | undefined, maxLength: number = 50): string {
    if (!message) return 'Aucun message';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  }
}
