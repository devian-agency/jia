import { create } from "zustand";
import { Id } from "../../convex/_generated/dataModel";

// ============================================
// User Store
// ============================================
interface UserState {
  userId: Id<"users"> | null;
  deviceId: string | null;
  isInitialized: boolean;
  setUserId: (id: Id<"users"> | null) => void;
  setDeviceId: (id: string) => void;
  setInitialized: (value: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  deviceId: null,
  isInitialized: false,
  setUserId: (id) => set({ userId: id }),
  setDeviceId: (id) => set({ deviceId: id }),
  setInitialized: (value) => set({ isInitialized: value }),
}));

// ============================================
// Chat Store
// ============================================
interface ChatState {
  conversationId: Id<"conversations"> | null;
  isTyping: boolean;
  isJiaTyping: boolean;
  messageInput: string;
  replyingTo: Id<"messages"> | null;
  setConversationId: (id: Id<"conversations"> | null) => void;
  setIsTyping: (value: boolean) => void;
  setIsJiaTyping: (value: boolean) => void;
  setMessageInput: (value: string) => void;
  setReplyingTo: (id: Id<"messages"> | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversationId: null,
  isTyping: false,
  isJiaTyping: false,
  messageInput: "",
  replyingTo: null,
  setConversationId: (id) => set({ conversationId: id }),
  setIsTyping: (value) => set({ isTyping: value }),
  setIsJiaTyping: (value) => set({ isJiaTyping: value }),
  setMessageInput: (value) => set({ messageInput: value }),
  setReplyingTo: (id) => set({ replyingTo: id }),
}));

// ============================================
// Media Store
// ============================================
interface SelectedMedia {
  uri: string;
  type: "image" | "video" | "audio";
  mimeType: string;
  fileName: string;
  fileSize: number;
}

interface MediaState {
  selectedMedia: SelectedMedia | null;
  isUploading: boolean;
  uploadProgress: number;
  setSelectedMedia: (media: SelectedMedia | null) => void;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (value: number) => void;
  clearMedia: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  selectedMedia: null,
  isUploading: false,
  uploadProgress: 0,
  setSelectedMedia: (media) => set({ selectedMedia: media }),
  setIsUploading: (value) => set({ isUploading: value }),
  setUploadProgress: (value) => set({ uploadProgress: value }),
  clearMedia: () =>
    set({ selectedMedia: null, isUploading: false, uploadProgress: 0 }),
}));

// ============================================
// UI Store
// ============================================
interface UIState {
  theme: "light" | "dark" | "auto";
  isProfileSheetOpen: boolean;
  isSettingsOpen: boolean;
  isMediaViewerOpen: boolean;
  viewingMediaUrl: string | null;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setProfileSheetOpen: (value: boolean) => void;
  setSettingsOpen: (value: boolean) => void;
  openMediaViewer: (url: string) => void;
  closeMediaViewer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "dark",
  isProfileSheetOpen: false,
  isSettingsOpen: false,
  isMediaViewerOpen: false,
  viewingMediaUrl: null,
  setTheme: (theme) => set({ theme }),
  setProfileSheetOpen: (value) => set({ isProfileSheetOpen: value }),
  setSettingsOpen: (value) => set({ isSettingsOpen: value }),
  openMediaViewer: (url) =>
    set({ isMediaViewerOpen: true, viewingMediaUrl: url }),
  closeMediaViewer: () =>
    set({ isMediaViewerOpen: false, viewingMediaUrl: null }),
}));

// ============================================
// Notification Store
// ============================================
interface NotificationState {
  unreadCount: number;
  lastCheckIn: number | null;
  streakCount: number;
  setUnreadCount: (count: number) => void;
  setLastCheckIn: (timestamp: number) => void;
  setStreakCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  lastCheckIn: null,
  streakCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLastCheckIn: (timestamp) => set({ lastCheckIn: timestamp }),
  setStreakCount: (count) => set({ streakCount: count }),
}));
