import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Message content type validator
const mediaValidator = v.optional(
  v.object({
    url: v.string(),
    publicId: v.string(),
    type: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  })
);

// Get messages for a conversation (paginated)
export const list = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      );

    const messages = await messagesQuery.order("asc").collect();

    // Filter out deleted messages
    const activeMessages = messages.filter((m) => !m.isDeleted);

    // Apply cursor-based pagination
    let result = activeMessages;
    if (args.cursor) {
      result = activeMessages.filter((m) => m.createdAt > args.cursor!);
    }

    // Apply limit
    if (args.limit) {
      result = result.slice(-args.limit);
    }

    return {
      messages: result,
      nextCursor:
        result.length > 0 ? result[result.length - 1].createdAt : null,
      hasMore: args.limit ? activeMessages.length > result.length : false,
    };
  },
});

// Get a single message
export const get = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

// Send a user message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    content: v.string(),
    contentType: v.optional(
      v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("audio"),
        v.literal("video"),
        v.literal("sticker"),
        v.literal("gif")
      )
    ),
    media: mediaValidator,
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the user message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "user",
      content: args.content,
      contentType: args.contentType || "text",
      media: args.media,
      reactions: [],
      tokensUsed: 0,
      createdAt: now,
      isRead: true,
      isDeleted: false,
      replyTo: args.replyTo,
    });

    // Update conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, {
        messageCount: conversation.messageCount + 1,
        lastMessage: args.content.substring(0, 100),
        updatedAt: now,
      });
    }

    return await ctx.db.get(messageId);
  },
});

// Create Jia's response message (placeholder while generating)
export const createAssistantPlaceholder = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "assistant",
      content: "",
      contentType: "text",
      reactions: [],
      tokensUsed: 0,
      createdAt: now,
      isRead: false,
      isDeleted: false,
    });

    return messageId;
  },
});

// Update assistant message with response
export const updateAssistantMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    tokensUsed: v.number(),
    sentiment: v.optional(
      v.object({
        score: v.number(),
        label: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    await ctx.db.patch(args.messageId, {
      content: args.content,
      tokensUsed: args.tokensUsed,
      sentiment: args.sentiment,
    });

    // Update conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (conversation) {
      await ctx.db.patch(message.conversationId, {
        messageCount: conversation.messageCount + 1,
        lastMessage: args.content.substring(0, 100),
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(args.messageId);
  },
});

// Add reaction to message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const existingReactions = message.reactions || [];

    // Check if this emoji already exists
    const existingIndex = existingReactions.findIndex(
      (r) => r.emoji === args.emoji
    );

    if (existingIndex >= 0) {
      // Remove the reaction (toggle off)
      existingReactions.splice(existingIndex, 1);
    } else {
      // Add the reaction
      existingReactions.push({
        emoji: args.emoji,
        addedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.messageId, {
      reactions: existingReactions,
    });

    return await ctx.db.get(args.messageId);
  },
});

// Delete message (soft delete)
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    });

    return { success: true };
  },
});

// Mark message as read
export const markAsRead = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      isRead: true,
    });

    return { success: true };
  },
});

// Mark all messages in conversation as read
export const markConversationRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const unreadMessages = messages.filter((m) => !m.isRead);

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }

    return { success: true, markedCount: unreadMessages.length };
  },
});

// Get unread message count for user
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    let totalUnread = 0;

    for (const conversation of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();

      totalUnread += messages.filter(
        (m) => !m.isRead && m.role === "assistant"
      ).length;
    }

    return totalUnread;
  },
});

// Get message context for AI (last N messages)
export const getContext = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(args.limit || 20);

    // Reverse to get chronological order
    const orderedMessages = messages.reverse();

    // Format for AI consumption
    return orderedMessages
      .filter((m) => !m.isDeleted)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.media
          ? `[${m.contentType}: ${m.media.url}] ${m.content}`
          : m.content,
      }));
  },
});

// Get media messages only
export const getMediaMessages = query({
  args: {
    conversationId: v.id("conversations"),
    mediaType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    let mediaMessages = messages.filter((m) => m.media && !m.isDeleted);

    if (args.mediaType) {
      mediaMessages = mediaMessages.filter(
        (m) => m.contentType === args.mediaType
      );
    }

    return mediaMessages;
  },
});

// Get message stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const userMessages = messages.filter(
      (m) => m.role === "user" && !m.isDeleted
    );
    const assistantMessages = messages.filter(
      (m) => m.role === "assistant" && !m.isDeleted
    );

    const totalTokens = messages.reduce((sum, m) => sum + m.tokensUsed, 0);

    const mediaCount = messages.filter((m) => m.media).length;

    // Calculate average message length
    const avgUserLength =
      userMessages.length > 0
        ? userMessages.reduce((sum, m) => sum + m.content.length, 0) /
          userMessages.length
        : 0;

    return {
      totalMessages: messages.filter((m) => !m.isDeleted).length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      totalTokensUsed: totalTokens,
      mediaShared: mediaCount,
      avgUserMessageLength: Math.round(avgUserLength),
    };
  },
});
