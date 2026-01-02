import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create notification
export const create = mutation({
  args: {
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
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data,
      isRead: false,
      createdAt: Date.now(),
      scheduledFor: args.scheduledFor,
    });

    return await ctx.db.get(notificationId);
  },
});

// Get notifications for user
export const list = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("userId", args.userId).eq("isRead", false)
        )
        .order("desc")
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    // Filter scheduled notifications that haven't reached their time yet
    const now = Date.now();
    notifications = notifications.filter(
      (n) => !n.scheduledFor || n.scheduledFor <= now
    );

    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    return notifications;
  },
});

// Mark notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
    return { success: true };
  },
});

// Mark all notifications as read
export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    // Only count notifications that should be shown now
    const activeNotifications = unreadNotifications.filter(
      (n) => !n.scheduledFor || n.scheduledFor <= now
    );

    return activeNotifications.length;
  },
});

// Delete old notifications (cleanup)
export const cleanupOld = mutation({
  args: {
    userId: v.id("users"),
    daysOld: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysOld || 30;
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const oldNotifications = notifications.filter(
      (n) => n.createdAt < cutoff && n.isRead
    );

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }

    return { deleted: oldNotifications.length };
  },
});
