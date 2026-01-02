import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Check in for today
export const checkIn = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split("T")[0];

    // Check if already checked in today
    const existingCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existingCheckin) {
      return {
        success: false,
        message: "Already checked in today",
        checkin: existingCheckin,
      };
    }

    // Get yesterday's date
    const yesterday = new Date(now - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const yesterdayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", yesterday)
      )
      .first();

    // Calculate streak
    const streakCount = yesterdayCheckin ? yesterdayCheckin.streakCount + 1 : 1;

    // Calculate bonus tokens based on streak
    let bonusTokens = 10; // Base bonus
    if (streakCount >= 7) bonusTokens = 50;
    else if (streakCount >= 30) bonusTokens = 100;
    else if (streakCount >= 100) bonusTokens = 200;

    // Check for special events today
    const todayMD = `${String(new Date(now).getMonth() + 1).padStart(2, "0")}-${String(new Date(now).getDate()).padStart(2, "0")}`;
    const specialEvents = await ctx.db
      .query("specialEvents")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todayEvent = specialEvents.find(
      (e) => e.isRecurring && e.date === todayMD
    );

    if (todayEvent) {
      bonusTokens *= 2; // Double bonus on special events
    }

    // Create check-in record
    const checkinId = await ctx.db.insert("dailyCheckins", {
      userId: args.userId,
      date: today,
      completedAt: now,
      streakCount,
      bonusTokens,
      specialEvent: todayEvent?.title,
    });

    // Add bonus tokens to user
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        subscription: {
          ...user.subscription,
          tokensRemaining: user.subscription.tokensRemaining + bonusTokens,
        },
      });

      // Record token transaction
      await ctx.db.insert("tokenTransactions", {
        userId: args.userId,
        type: "bonus",
        amount: bonusTokens,
        balance: user.subscription.tokensRemaining + bonusTokens,
        description: `Daily check-in bonus (${streakCount} day streak)`,
        createdAt: now,
      });
    }

    // Create notification for streak milestones
    if ([7, 14, 30, 50, 100, 365].includes(streakCount)) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "streak",
        title: `🔥 ${streakCount} Day Streak!`,
        body: `Amazing! You've talked to Jia for ${streakCount} days in a row!`,
        isRead: false,
        createdAt: now,
      });
    }

    const checkin = await ctx.db.get(checkinId);
    return {
      success: true,
      checkin,
      bonusTokens,
      streakCount,
      specialEvent: todayEvent?.title,
    };
  },
});

// Get current streak
export const getCurrentStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date(now).toISOString().split("T")[0];

    const todayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (todayCheckin) {
      return {
        streakCount: todayCheckin.streakCount,
        checkedInToday: true,
      };
    }

    // Check yesterday to see if streak is still active
    const yesterday = new Date(now - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const yesterdayCheckin = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", yesterday)
      )
      .first();

    return {
      streakCount: yesterdayCheckin?.streakCount || 0,
      checkedInToday: false,
      canContinueStreak: !!yesterdayCheckin,
    };
  },
});

// Get check-in history
export const getHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 30);

    return checkins;
  },
});

// Get check-in calendar (for visualizing streak)
export const getCalendar = query({
  args: {
    userId: v.id("users"),
    month: v.number(), // 1-12
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter to the specified month
    const monthStr = String(args.month).padStart(2, "0");
    const monthCheckins = checkins.filter((c) =>
      c.date.startsWith(`${args.year}-${monthStr}`)
    );

    // Create calendar array
    const daysInMonth = new Date(args.year, args.month, 0).getDate();
    const calendar: Array<{
      day: number;
      date: string;
      checkedIn: boolean;
      streakCount: number | null;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${args.year}-${monthStr}-${String(day).padStart(2, "0")}`;
      const checkin = monthCheckins.find((c) => c.date === dateStr);

      calendar.push({
        day,
        date: dateStr,
        checkedIn: !!checkin,
        streakCount: checkin?.streakCount || null,
      });
    }

    return calendar;
  },
});

// Get longest streak ever
export const getLongestStreak = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    if (checkins.length === 0) {
      return { longestStreak: 0 };
    }

    const maxStreak = Math.max(...checkins.map((c) => c.streakCount));
    const bestDay = checkins.find((c) => c.streakCount === maxStreak);

    return {
      longestStreak: maxStreak,
      achievedOn: bestDay?.date,
    };
  },
});

// Get total bonus tokens earned
export const getTotalBonusEarned = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const total = checkins.reduce((sum, c) => sum + c.bonusTokens, 0);
    return { totalBonusTokens: total, totalCheckins: checkins.length };
  },
});
