import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create special event
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("specialEvents", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      description: args.description,
      date: args.date,
      isRecurring: args.isRecurring,
      createdAt: Date.now(),
    });

    return await ctx.db.get(eventId);
  },
});

// Get all events for user
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("specialEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get upcoming events
export const getUpcoming = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToCheck = args.days || 30;
    const events = await ctx.db
      .query("specialEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const now = new Date();
    const upcoming: Array<{
      event: (typeof events)[0];
      daysUntil: number;
      nextOccurrence: Date;
    }> = [];

    for (const event of events) {
      let nextOccurrence: Date | null = null;

      if (event.isRecurring) {
        // Parse MM-DD format
        const [month, day] = event.date.split("-").map(Number);
        nextOccurrence = new Date(now.getFullYear(), month - 1, day);

        // If the date has passed this year, use next year
        if (nextOccurrence < now) {
          nextOccurrence = new Date(now.getFullYear() + 1, month - 1, day);
        }
      } else {
        // Parse YYYY-MM-DD format
        nextOccurrence = new Date(event.date);
      }

      const daysUntil = Math.ceil(
        (nextOccurrence.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil >= 0 && daysUntil <= daysToCheck) {
        upcoming.push({
          event,
          daysUntil,
          nextOccurrence,
        });
      }
    }

    // Sort by days until
    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  },
});

// Get today's events
export const getTodays = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("specialEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const now = new Date();
    const todayMD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayFull = now.toISOString().split("T")[0];

    return events.filter((event) => {
      if (event.isRecurring) {
        return event.date === todayMD;
      } else {
        return event.date === todayFull;
      }
    });
  },
});

// Update event
export const update = mutation({
  args: {
    eventId: v.id("specialEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(eventId, filteredUpdates);
    }

    return await ctx.db.get(eventId);
  },
});

// Delete event
export const deleteEvent = mutation({
  args: { eventId: v.id("specialEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

// Mark event as celebrated
export const markCelebrated = mutation({
  args: { eventId: v.id("specialEvents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      lastCelebratedAt: Date.now(),
    });

    return await ctx.db.get(args.eventId);
  },
});

// Initialize default events for new users
export const initializeDefaults = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = new Date(now);
    const anniversaryDate = `${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

    // Create relationship anniversary
    await ctx.db.insert("specialEvents", {
      userId: args.userId,
      type: "anniversary",
      title: "Our Anniversary 💕",
      description: "The day we started our journey together",
      date: anniversaryDate,
      isRecurring: true,
      createdAt: now,
    });

    return { success: true };
  },
});
