import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record mood from conversation
export const record = mutation({
  args: {
    userId: v.id("users"),
    mood: v.string(),
    intensity: v.number(),
    detectedFrom: v.id("messages"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const moodId = await ctx.db.insert("moodHistory", {
      userId: args.userId,
      mood: args.mood,
      intensity: Math.min(10, Math.max(1, args.intensity)),
      detectedFrom: args.detectedFrom,
      createdAt: Date.now(),
      notes: args.notes,
    });

    return await ctx.db.get(moodId);
  },
});

// Get mood history
export const getHistory = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let moods = await ctx.db
      .query("moodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filter by days if specified
    if (args.days) {
      const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;
      moods = moods.filter((m) => m.createdAt >= cutoff);
    }

    if (args.limit) {
      moods = moods.slice(0, args.limit);
    }

    return moods;
  },
});

// Get current/latest mood
export const getCurrent = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const latestMood = await ctx.db
      .query("moodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return latestMood;
  },
});

// Get mood analytics
export const getAnalytics = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToAnalyze = args.days || 30;
    const cutoff = Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000;

    const moods = await ctx.db
      .query("moodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentMoods = moods.filter((m) => m.createdAt >= cutoff);

    // Count mood occurrences
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;

    for (const mood of recentMoods) {
      moodCounts[mood.mood] = (moodCounts[mood.mood] || 0) + 1;
      totalIntensity += mood.intensity;
    }

    // Find dominant mood
    let dominantMood = null;
    let maxCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        dominantMood = mood;
        maxCount = count;
      }
    }

    // Calculate mood by day of week
    const moodByDay: Record<number, { mood: string; count: number }[]> = {};
    for (const mood of recentMoods) {
      const day = new Date(mood.createdAt).getDay();
      if (!moodByDay[day]) {
        moodByDay[day] = [];
      }
      moodByDay[day].push({ mood: mood.mood, count: 1 });
    }

    // Calculate mood by time of day
    const moodByHour: Record<string, number> = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };
    for (const mood of recentMoods) {
      const hour = new Date(mood.createdAt).getHours();
      if (hour >= 5 && hour < 12) moodByHour.morning++;
      else if (hour >= 12 && hour < 17) moodByHour.afternoon++;
      else if (hour >= 17 && hour < 21) moodByHour.evening++;
      else moodByHour.night++;
    }

    return {
      totalEntries: recentMoods.length,
      moodCounts,
      dominantMood,
      averageIntensity:
        recentMoods.length > 0 ? totalIntensity / recentMoods.length : 0,
      moodByTimeOfDay: moodByHour,
      analyzedDays: daysToAnalyze,
    };
  },
});

// Get mood trend (is user generally happy/sad over time?)
export const getTrend = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToAnalyze = args.days || 14;
    const cutoff = Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000;
    const midpoint = Date.now() - (daysToAnalyze / 2) * 24 * 60 * 60 * 1000;

    const moods = await ctx.db
      .query("moodHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentMoods = moods.filter((m) => m.createdAt >= cutoff);

    // Assign sentiment scores to moods
    const moodScores: Record<string, number> = {
      happy: 1,
      excited: 1,
      loving: 1,
      grateful: 0.8,
      content: 0.6,
      calm: 0.5,
      neutral: 0,
      tired: -0.3,
      stressed: -0.5,
      anxious: -0.6,
      sad: -0.8,
      angry: -0.7,
      frustrated: -0.6,
      lonely: -0.7,
    };

    // Calculate first half and second half averages
    const firstHalf = recentMoods.filter((m) => m.createdAt < midpoint);
    const secondHalf = recentMoods.filter((m) => m.createdAt >= midpoint);

    const avgFirst =
      firstHalf.length > 0
        ? firstHalf.reduce(
            (sum, m) => sum + (moodScores[m.mood.toLowerCase()] || 0),
            0
          ) / firstHalf.length
        : 0;

    const avgSecond =
      secondHalf.length > 0
        ? secondHalf.reduce(
            (sum, m) => sum + (moodScores[m.mood.toLowerCase()] || 0),
            0
          ) / secondHalf.length
        : 0;

    const trend = avgSecond - avgFirst;

    let trendLabel = "stable";
    if (trend > 0.2) trendLabel = "improving";
    else if (trend < -0.2) trendLabel = "declining";

    return {
      trend: trendLabel,
      trendScore: trend,
      firstHalfAverage: avgFirst,
      secondHalfAverage: avgSecond,
      dataPoints: recentMoods.length,
    };
  },
});
