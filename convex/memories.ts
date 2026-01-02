import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all memories for a user
export const list = query({
  args: {
    userId: v.id("users"),
    category: v.optional(
      v.union(
        v.literal("preference"),
        v.literal("event"),
        v.literal("emotion"),
        v.literal("milestone"),
        v.literal("fact"),
        v.literal("promise")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let memoriesQuery;

    if (args.category) {
      memoriesQuery = ctx.db
        .query("memories")
        .withIndex("by_user_category", (q) =>
          q.eq("userId", args.userId).eq("category", args.category!)
        );
    } else {
      memoriesQuery = ctx.db
        .query("memories")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));
    }

    const memories = await memoriesQuery.order("desc").collect();

    if (args.limit) {
      return memories.slice(0, args.limit);
    }

    return memories;
  },
});

// Get important memories (for AI context)
export const getImportant = query({
  args: {
    userId: v.id("users"),
    minImportance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_importance", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const minImportance = args.minImportance || 5;
    const importantMemories = memories.filter(
      (m) => m.importance >= minImportance
    );

    if (args.limit) {
      return importantMemories.slice(0, args.limit);
    }

    return importantMemories;
  },
});

// Create a new memory
export const create = mutation({
  args: {
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
    importance: v.number(),
    extractedFrom: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const memoryId = await ctx.db.insert("memories", {
      userId: args.userId,
      category: args.category,
      content: args.content,
      importance: Math.min(10, Math.max(1, args.importance)), // Clamp 1-10
      extractedFrom: args.extractedFrom,
      createdAt: now,
      referenceCount: 0,
    });

    return await ctx.db.get(memoryId);
  },
});

// Update memory importance
export const updateImportance = mutation({
  args: {
    memoryId: v.id("memories"),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.memoryId, {
      importance: Math.min(10, Math.max(1, args.importance)),
    });

    return await ctx.db.get(args.memoryId);
  },
});

// Record memory reference (when Jia uses a memory)
export const recordReference = mutation({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) throw new Error("Memory not found");

    await ctx.db.patch(args.memoryId, {
      lastReferencedAt: Date.now(),
      referenceCount: memory.referenceCount + 1,
    });

    return await ctx.db.get(args.memoryId);
  },
});

// Delete a memory
export const deleteMemory = mutation({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});

// Get memory context for AI (formatted for system prompt)
export const getContextForAI = query({
  args: {
    userId: v.id("users"),
    maxMemories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.maxMemories || 15;

    // Get a mix of different memory types
    const allMemories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by importance and recency
    const sortedMemories = allMemories.sort((a, b) => {
      // Prioritize by importance, then by recency
      const importanceScore = (b.importance - a.importance) * 2;
      const recencyScore = (b.createdAt - a.createdAt) / (1000 * 60 * 60 * 24); // Days
      return importanceScore - recencyScore;
    });

    const selectedMemories = sortedMemories.slice(0, limit);

    // Group by category
    const grouped: Record<string, string[]> = {};
    for (const memory of selectedMemories) {
      if (!grouped[memory.category]) {
        grouped[memory.category] = [];
      }
      grouped[memory.category].push(memory.content);
    }

    // Format for AI context
    let contextString = "Important things you remember about the user:\n\n";

    const categoryLabels: Record<string, string> = {
      preference: "Preferences",
      event: "Past Events",
      emotion: "Emotional Moments",
      milestone: "Relationship Milestones",
      fact: "Facts About Them",
      promise: "Promises Made",
    };

    for (const [category, memories] of Object.entries(grouped)) {
      contextString += `${categoryLabels[category] || category}:\n`;
      memories.forEach((m) => {
        contextString += `- ${m}\n`;
      });
      contextString += "\n";
    }

    return {
      context: contextString,
      totalMemories: allMemories.length,
      usedMemories: selectedMemories.length,
    };
  },
});

// Extract memories from conversation (to be called by AI action)
export const extractFromMessage = mutation({
  args: {
    userId: v.id("users"),
    messageId: v.id("messages"),
    memories: v.array(
      v.object({
        category: v.union(
          v.literal("preference"),
          v.literal("event"),
          v.literal("emotion"),
          v.literal("milestone"),
          v.literal("fact"),
          v.literal("promise")
        ),
        content: v.string(),
        importance: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const createdMemories = [];
    const now = Date.now();

    for (const memory of args.memories) {
      const memoryId = await ctx.db.insert("memories", {
        userId: args.userId,
        category: memory.category,
        content: memory.content,
        importance: Math.min(10, Math.max(1, memory.importance)),
        extractedFrom: args.messageId,
        createdAt: now,
        referenceCount: 0,
      });

      createdMemories.push(await ctx.db.get(memoryId));
    }

    return createdMemories;
  },
});

// Search memories
export const search = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const searchTerm = args.query.toLowerCase();
    return memories.filter((m) => m.content.toLowerCase().includes(searchTerm));
  },
});

// Get memory stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const byCategory: Record<string, number> = {};
    let totalImportance = 0;
    let totalReferences = 0;

    for (const memory of memories) {
      byCategory[memory.category] = (byCategory[memory.category] || 0) + 1;
      totalImportance += memory.importance;
      totalReferences += memory.referenceCount;
    }

    return {
      total: memories.length,
      byCategory,
      averageImportance:
        memories.length > 0 ? totalImportance / memories.length : 0,
      totalReferences,
      oldestMemory:
        memories.length > 0
          ? Math.min(...memories.map((m) => m.createdAt))
          : null,
      newestMemory:
        memories.length > 0
          ? Math.max(...memories.map((m) => m.createdAt))
          : null,
    };
  },
});
