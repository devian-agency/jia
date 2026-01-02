import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles
  users: defineTable({
    clerkId: v.optional(v.string()),
    deviceId: v.string(), // For anonymous users
    name: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    settings: v.object({
      theme: v.union(v.literal("light"), v.literal("dark"), v.literal("auto")),
      language: v.string(),
      hapticFeedback: v.boolean(),
      notificationsEnabled: v.boolean(),
      soundEnabled: v.boolean(),
    }),
    subscription: v.object({
      tier: v.union(
        v.literal("free"),
        v.literal("premium"),
        v.literal("ultimate")
      ),
      tokensRemaining: v.number(),
      tokensUsedToday: v.number(),
      lastTokenRefresh: v.number(),
      expiresAt: v.optional(v.number()),
    }),
  })
    .index("by_device", ["deviceId"])
    .index("by_clerk", ["clerkId"]),

  // AI Girlfriend Profile (customizable)
  jiaProfile: defineTable({
    userId: v.id("users"),
    name: v.string(),
    personality: v.object({
      warmth: v.number(), // 0-100
      playfulness: v.number(),
      possessiveness: v.number(),
      romanticism: v.number(),
      supportiveness: v.number(),
      humor: v.number(),
    }),
    interests: v.array(v.string()),
    relationshipStatus: v.string(),
    relationshipStartDate: v.number(),
    customTraits: v.array(v.string()),
    voiceStyle: v.union(
      v.literal("sweet"),
      v.literal("playful"),
      v.literal("mature"),
      v.literal("caring")
    ),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Conversation threads
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    messageCount: v.number(),
    lastMessage: v.optional(v.string()),
    mood: v.optional(v.string()), // Current mood of conversation
    isArchived: v.boolean(),
    isPinned: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // Messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    contentType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("sticker"),
      v.literal("gif")
    ),
    media: v.optional(
      v.object({
        url: v.string(),
        publicId: v.string(),
        type: v.string(),
        thumbnail: v.optional(v.string()),
        duration: v.optional(v.number()), // For audio/video
        width: v.optional(v.number()),
        height: v.optional(v.number()),
      })
    ),
    reactions: v.array(
      v.object({
        emoji: v.string(),
        addedAt: v.number(),
      })
    ),
    sentiment: v.optional(
      v.object({
        score: v.number(), // -1 to 1
        label: v.string(), // positive, negative, neutral
      })
    ),
    tokensUsed: v.number(),
    createdAt: v.number(),
    isRead: v.boolean(),
    isDeleted: v.boolean(),
    replyTo: v.optional(v.id("messages")),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),

  // Memory system - Jia remembers important things
  memories: defineTable({
    userId: v.id("users"),
    category: v.union(
      v.literal("preference"),
      v.literal("event"),
      v.literal("emotion"),
      v.literal("milestone"),
      v.literal("fact"),
      v.literal("promise")
    ),
    content: v.string(),
    importance: v.number(), // 1-10
    extractedFrom: v.optional(v.id("messages")),
    createdAt: v.number(),
    lastReferencedAt: v.optional(v.number()),
    referenceCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_category", ["userId", "category"])
    .index("by_importance", ["userId", "importance"]),

  // Mood tracking
  moodHistory: defineTable({
    userId: v.id("users"),
    mood: v.string(),
    intensity: v.number(), // 1-10
    detectedFrom: v.id("messages"),
    createdAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId", "createdAt"]),

  // Token transactions
  tokenTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("usage"),
      v.literal("purchase"),
      v.literal("bonus"),
      v.literal("refund"),
      v.literal("daily_refresh")
    ),
    amount: v.number(), // negative for usage, positive for additions
    balance: v.number(), // balance after transaction
    description: v.string(),
    messageId: v.optional(v.id("messages")),
    createdAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

  // Media uploads queue
  mediaUploads: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    cloudinaryPublicId: v.optional(v.string()),
    cloudinaryUrl: v.optional(v.string()),
    originalFileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    uploadProgress: v.number(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  // Daily check-ins and streaks
  dailyCheckins: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    completedAt: v.number(),
    streakCount: v.number(),
    bonusTokens: v.number(),
    specialEvent: v.optional(v.string()),
  }).index("by_user_date", ["userId", "date"]),

  // Special events & anniversaries
  specialEvents: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("anniversary"),
      v.literal("birthday"),
      v.literal("milestone"),
      v.literal("custom")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // MM-DD for recurring, YYYY-MM-DD for specific
    isRecurring: v.boolean(),
    lastCelebratedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Notification queue
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("reminder"),
      v.literal("milestone"),
      v.literal("token_low"),
      v.literal("special_event"),
      v.literal("streak")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
    scheduledFor: v.optional(v.number()),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_unread", ["userId", "isRead"]),
});
