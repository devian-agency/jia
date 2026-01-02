import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUserStore, useChatStore, useMediaStore } from "../stores";
import { useCallback, useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// ============================================
// User Hooks
// ============================================
export function useInitializeUser() {
  const { deviceId, setUserId, setInitialized } = useUserStore();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const refreshTokens = useMutation(api.users.refreshDailyTokens);

  const initialize = useCallback(
    async (deviceIdToUse: string) => {
      try {
        const user = await getOrCreateUser({ deviceId: deviceIdToUse });
        if (user) {
          setUserId(user._id);
          // Refresh daily tokens if needed
          await refreshTokens({ userId: user._id });
        }
        setInitialized(true);
        return user;
      } catch (error) {
        console.error("Failed to initialize user:", error);
        setInitialized(true);
        return null;
      }
    },
    [getOrCreateUser, refreshTokens, setUserId, setInitialized]
  );

  return { initialize };
}

export function useUser() {
  const { userId } = useUserStore();
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  return user;
}

export function useTokenInfo() {
  const { userId } = useUserStore();
  const tokenInfo = useQuery(
    api.users.getTokenInfo,
    userId ? { userId } : "skip"
  );
  return tokenInfo;
}

// ============================================
// Jia Profile Hooks
// ============================================
export function useJiaProfile() {
  const { userId } = useUserStore();
  const profile = useQuery(
    api.jiaProfile.getProfile,
    userId ? { userId } : "skip"
  );
  return profile;
}

export function useJiaSystemPrompt() {
  const { userId } = useUserStore();
  const systemPrompt = useQuery(
    api.jiaProfile.generateSystemPrompt,
    userId ? { userId } : "skip"
  );
  return systemPrompt;
}

export function useRelationshipStats() {
  const { userId } = useUserStore();
  const stats = useQuery(
    api.jiaProfile.getRelationshipStats,
    userId ? { userId } : "skip"
  );
  return stats;
}

export function useUpdateJiaPersonality() {
  const { userId } = useUserStore();
  const updatePersonality = useMutation(api.jiaProfile.updatePersonality);

  return useCallback(
    async (personality: {
      warmth?: number;
      playfulness?: number;
      possessiveness?: number;
      romanticism?: number;
      supportiveness?: number;
      humor?: number;
    }) => {
      if (!userId) return;
      return await updatePersonality({ userId, personality });
    },
    [userId, updatePersonality]
  );
}

// ============================================
// Conversation Hooks
// ============================================
export function useConversations() {
  const { userId } = useUserStore();
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  );
  return conversations;
}

export function useConversation() {
  const { conversationId } = useChatStore();
  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { conversationId } : "skip"
  );
  return conversation;
}

export function useGetOrCreateConversation() {
  const { userId } = useUserStore();
  const { setConversationId } = useChatStore();
  const getOrCreateActive = useMutation(api.conversations.getOrCreateActive);

  return useCallback(async () => {
    if (!userId) return null;
    const conversation = await getOrCreateActive({ userId });
    if (conversation) {
      setConversationId(conversation._id);
    }
    return conversation;
  }, [userId, getOrCreateActive, setConversationId]);
}

// ============================================
// Message Hooks
// ============================================
export function useMessages() {
  const { conversationId } = useChatStore();
  const messagesData = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );
  return messagesData?.messages || [];
}

export function useMessageContext() {
  const { conversationId } = useChatStore();
  const context = useQuery(
    api.messages.getContext,
    conversationId ? { conversationId, limit: 20 } : "skip"
  );
  return context || [];
}

export function useSendMessage() {
  console.log("useSendMessage");

  const { userId } = useUserStore();
  const { conversationId, setIsJiaTyping, setMessageInput } = useChatStore();
  const { selectedMedia, clearMedia } = useMediaStore();

  const sendMessage = useMutation(api.messages.send);
  const createPlaceholder = useMutation(
    api.messages.createAssistantPlaceholder
  );
  const updateAssistantMessage = useMutation(
    api.messages.updateAssistantMessage
  );
  const deductTokens = useMutation(api.users.deductTokens);

  const jiaProfile = useJiaProfile();
  const user = useUser();
  const memories = useQuery(
    api.memories.getImportant,
    userId ? { userId, limit: 10 } : "skip"
  );
  const relationshipStats = useRelationshipStats();

  return useCallback(
    async (content: string) => {
      if (!userId || !conversationId || !content.trim()) return;

      try {
        // Clear input immediately
        setMessageInput("");

        // Handle media upload if present
        let mediaData = undefined;
        let mediaDescription = "";

        if (selectedMedia) {
          // Get signed upload URL
          const signResponse = await fetch(`${API_URL}/media/sign-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder: "jia-chat" }),
          });
          const signData = await signResponse.json();

          // Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", {
            uri: selectedMedia.uri,
            type: selectedMedia.mimeType,
            name: selectedMedia.fileName,
          } as unknown as Blob);
          formData.append("timestamp", signData.timestamp.toString());
          formData.append("signature", signData.signature);
          formData.append("api_key", signData.apiKey);
          formData.append("folder", signData.folder);

          const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`,
            { method: "POST", body: formData }
          );
          const uploadData = await uploadResponse.json();

          if (uploadData.secure_url) {
            mediaData = {
              url: uploadData.secure_url,
              publicId: uploadData.public_id,
              type: selectedMedia.type,
              width: uploadData.width,
              height: uploadData.height,
            };

            // Analyze image for AI context
            if (selectedMedia.type === "image") {
              try {
                const analyzeResponse = await fetch(
                  `${API_URL}/ai/analyze-image`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageUrl: uploadData.secure_url }),
                  }
                );
                const analyzeData = await analyzeResponse.json();
                mediaDescription = analyzeData.description;
              } catch {
                mediaDescription = "A photo was shared";
              }
            }
          }

          clearMedia();
        }

        // Send user message
        console.log("Sending user message");
        await sendMessage({
          conversationId,
          userId,
          content,
          contentType: selectedMedia ? selectedMedia.type : "text",
          media: mediaData,
        });
        console.log("User message sent");

        // Create placeholder for Jia's response
        setIsJiaTyping(true);
        console.log("Creating placeholder");
        const placeholderId = await createPlaceholder({
          conversationId,
          userId,
        });
        console.log("Placeholder created");

        // Build AI request
        const messageContext = await fetch(`${API_URL}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content }],
            jiaProfile: jiaProfile
              ? {
                  name: jiaProfile.name,
                  personality: jiaProfile.personality,
                  voiceStyle: jiaProfile.voiceStyle,
                }
              : undefined,
            userName: user?.name || "darling",
            memories:
              memories?.map((m) => ({
                category: m.category,
                content: m.content,
              })) || [],
            relationshipDays: relationshipStats?.relationshipDuration.days || 1,
            hasMedia: !!selectedMedia,
            mediaDescription,
          }),
        });

        const aiResponse = await messageContext.json();

        // Update the placeholder with actual response
        await updateAssistantMessage({
          messageId: placeholderId,
          content: aiResponse.message,
          tokensUsed: aiResponse.tokensUsed || 0,
          sentiment: aiResponse.sentiment,
        });

        // Deduct tokens
        if (aiResponse.tokensUsed > 0) {
          await deductTokens({
            userId,
            amount: aiResponse.tokensUsed,
            description: "Chat message",
            messageId: placeholderId,
          });
        }

        setIsJiaTyping(false);
      } catch (error) {
        console.error("Failed to send message:", error);
        setIsJiaTyping(false);
      }
    },
    [
      userId,
      conversationId,
      selectedMedia,
      jiaProfile,
      user,
      memories,
      relationshipStats,
      sendMessage,
      createPlaceholder,
      updateAssistantMessage,
      deductTokens,
      setMessageInput,
      setIsJiaTyping,
      clearMedia,
    ]
  );
}

export function useAddReaction() {
  const addReaction = useMutation(api.messages.addReaction);

  return useCallback(
    async (messageId: Id<"messages">, emoji: string) => {
      await addReaction({ messageId, emoji });
    },
    [addReaction]
  );
}

// ============================================
// Memory Hooks
// ============================================
export function useMemories() {
  const { userId } = useUserStore();
  const memories = useQuery(api.memories.list, userId ? { userId } : "skip");
  return memories || [];
}

export function useMemoryStats() {
  const { userId } = useUserStore();
  const stats = useQuery(api.memories.getStats, userId ? { userId } : "skip");
  return stats;
}

// ============================================
// Daily Check-in Hooks
// ============================================
export function useCurrentStreak() {
  const { userId } = useUserStore();
  const streak = useQuery(
    api.dailyCheckins.getCurrentStreak,
    userId ? { userId } : "skip"
  );
  return streak;
}

export function useDailyCheckIn() {
  const { userId } = useUserStore();
  const checkIn = useMutation(api.dailyCheckins.checkIn);

  return useCallback(async () => {
    if (!userId) return null;
    return await checkIn({ userId });
  }, [userId, checkIn]);
}

// ============================================
// Mood Hooks
// ============================================
export function useCurrentMood() {
  const { userId } = useUserStore();
  const mood = useQuery(api.mood.getCurrent, userId ? { userId } : "skip");
  return mood;
}

export function useMoodAnalytics() {
  const { userId } = useUserStore();
  const analytics = useQuery(
    api.mood.getAnalytics,
    userId ? { userId, days: 30 } : "skip"
  );
  return analytics;
}

// ============================================
// Notification Hooks
// ============================================
export function useNotifications() {
  const { userId } = useUserStore();
  const notifications = useQuery(
    api.notifications.list,
    userId ? { userId, limit: 20 } : "skip"
  );
  return notifications || [];
}

export function useUnreadCount() {
  const { userId } = useUserStore();
  const count = useQuery(
    api.notifications.getUnreadCount,
    userId ? { userId } : "skip"
  );
  return count || 0;
}

// ============================================
// Special Events Hooks
// ============================================
export function useUpcomingEvents() {
  const { userId } = useUserStore();
  const events = useQuery(
    api.specialEvents.getUpcoming,
    userId ? { userId, days: 30 } : "skip"
  );
  return events || [];
}

export function useTodaysEvents() {
  const { userId } = useUserStore();
  const events = useQuery(
    api.specialEvents.getTodays,
    userId ? { userId } : "skip"
  );
  return events || [];
}
