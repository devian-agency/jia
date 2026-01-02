import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all conversations for a user
export const list = query({
  args: {
    userId: v.id("users"),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (!args.includeArchived) {
      conversations = conversations.filter((c) => !c.isArchived);
    }

    // Sort: pinned first, then by updatedAt
    return conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  },
});

// Get a single conversation
export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      isArchived: false,
      isPinned: false,
    });

    return await ctx.db.get(conversationId);
  },
});

// Update conversation title
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// Toggle pin status
export const togglePin = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(args.conversationId, {
      isPinned: !conversation.isPinned,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// Archive conversation
export const archive = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// Unarchive conversation
export const unarchive = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isArchived: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// Delete conversation and all its messages
export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);

    return { success: true, deletedMessages: messages.length };
  },
});

// Get or create active conversation
export const getOrCreateActive = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Find the most recent non-archived conversation
    const existingConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const activeConversation = existingConversations.find((c) => !c.isArchived);

    if (activeConversation) {
      return activeConversation;
    }

    // Create new conversation if none exists
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      userId: args.userId,
      title: `Chat with Jia`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      isArchived: false,
      isPinned: false,
    });

    return await ctx.db.get(conversationId);
  },
});

// Update mood of conversation
export const updateMood = mutation({
  args: {
    conversationId: v.id("conversations"),
    mood: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      mood: args.mood,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// Search conversations by message content
export const search = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const results = [];
    const searchTerm = args.query.toLowerCase();

    for (const conversation of conversations) {
      // Check if title matches
      if (conversation.title.toLowerCase().includes(searchTerm)) {
        results.push({
          conversation,
          matchType: "title",
          matchedText: conversation.title,
        });
        continue;
      }

      // Check if any message matches
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversation._id)
        )
        .collect();

      for (const message of messages) {
        if (message.content.toLowerCase().includes(searchTerm)) {
          results.push({
            conversation,
            matchType: "message",
            matchedText: message.content,
            messageId: message._id,
          });
          break; // Only include conversation once
        }
      }
    }

    return results;
  },
});
