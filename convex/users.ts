import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create user by device ID
export const getOrCreateUser = mutation({
  args: {
    deviceId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existingUser) {
      // Update last active
      await ctx.db.patch(existingUser._id, {
        lastActiveAt: Date.now(),
      });
      return existingUser;
    }

    // Create new user with default settings
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      deviceId: args.deviceId,
      name: args.name || "Anonymous",
      createdAt: now,
      lastActiveAt: now,
      settings: {
        theme: "dark",
        language: "en",
        hapticFeedback: true,
        notificationsEnabled: true,
        soundEnabled: true,
      },
      subscription: {
        tier: "free",
        tokensRemaining: 1000, // Free tier gets 1000 tokens daily
        tokensUsedToday: 0,
        lastTokenRefresh: now,
      },
    });

    // Create default Jia profile for this user
    await ctx.db.insert("jiaProfile", {
      userId,
      name: "Jia",
      personality: {
        warmth: 85,
        playfulness: 75,
        possessiveness: 70,
        romanticism: 80,
        supportiveness: 90,
        humor: 70,
      },
      interests: ["shopping", "movies", "cooking", "traveling", "gaming"],
      relationshipStatus: "In a loving relationship",
      relationshipStartDate: now,
      customTraits: ["caring", "playful", "slightly jealous", "supportive"],
      voiceStyle: "sweet",
      createdAt: now,
      updatedAt: now,
    });

    const user = await ctx.db.get(userId);
    return user;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(userId, filteredUpdates);
    }

    return await ctx.db.get(userId);
  },
});

// Update user settings
export const updateSettings = mutation({
  args: {
    userId: v.id("users"),
    settings: v.object({
      theme: v.optional(
        v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))
      ),
      language: v.optional(v.string()),
      hapticFeedback: v.optional(v.boolean()),
      notificationsEnabled: v.optional(v.boolean()),
      soundEnabled: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updatedSettings = { ...user.settings };

    if (args.settings.theme !== undefined)
      updatedSettings.theme = args.settings.theme;
    if (args.settings.language !== undefined)
      updatedSettings.language = args.settings.language;
    if (args.settings.hapticFeedback !== undefined)
      updatedSettings.hapticFeedback = args.settings.hapticFeedback;
    if (args.settings.notificationsEnabled !== undefined)
      updatedSettings.notificationsEnabled = args.settings.notificationsEnabled;
    if (args.settings.soundEnabled !== undefined)
      updatedSettings.soundEnabled = args.settings.soundEnabled;

    await ctx.db.patch(args.userId, { settings: updatedSettings });
    return await ctx.db.get(args.userId);
  },
});

// Get token balance and usage
export const getTokenInfo = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const tierLimits = {
      free: 1000,
      premium: 10000,
      ultimate: 100000,
    };

    return {
      tier: user.subscription.tier,
      tokensRemaining: user.subscription.tokensRemaining,
      tokensUsedToday: user.subscription.tokensUsedToday,
      dailyLimit: tierLimits[user.subscription.tier],
      percentUsed:
        (user.subscription.tokensUsedToday /
          tierLimits[user.subscription.tier]) *
        100,
    };
  },
});

// Refresh daily tokens (should be called periodically or on app open)
export const refreshDailyTokens = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const lastRefresh = user.subscription.lastTokenRefresh;
    const dayInMs = 24 * 60 * 60 * 1000;

    // Check if a day has passed since last refresh
    if (now - lastRefresh >= dayInMs) {
      const tierLimits = {
        free: 1000,
        premium: 10000,
        ultimate: 100000,
      };

      await ctx.db.patch(args.userId, {
        subscription: {
          ...user.subscription,
          tokensRemaining: tierLimits[user.subscription.tier],
          tokensUsedToday: 0,
          lastTokenRefresh: now,
        },
      });

      // Record the refresh transaction
      await ctx.db.insert("tokenTransactions", {
        userId: args.userId,
        type: "daily_refresh",
        amount:
          tierLimits[user.subscription.tier] -
          user.subscription.tokensRemaining,
        balance: tierLimits[user.subscription.tier],
        description: "Daily token refresh",
        createdAt: now,
      });

      return {
        refreshed: true,
        newBalance: tierLimits[user.subscription.tier],
      };
    }

    return {
      refreshed: false,
      currentBalance: user.subscription.tokensRemaining,
    };
  },
});

// Deduct tokens for usage
export const deductTokens = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.subscription.tokensRemaining < args.amount) {
      throw new Error("Insufficient tokens");
    }

    const newBalance = user.subscription.tokensRemaining - args.amount;

    await ctx.db.patch(args.userId, {
      subscription: {
        ...user.subscription,
        tokensRemaining: newBalance,
        tokensUsedToday: user.subscription.tokensUsedToday + args.amount,
      },
    });

    await ctx.db.insert("tokenTransactions", {
      userId: args.userId,
      type: "usage",
      amount: -args.amount,
      balance: newBalance,
      description: args.description,
      messageId: args.messageId,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

// Add bonus tokens
export const addBonusTokens = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const newBalance = user.subscription.tokensRemaining + args.amount;

    await ctx.db.patch(args.userId, {
      subscription: {
        ...user.subscription,
        tokensRemaining: newBalance,
      },
    });

    await ctx.db.insert("tokenTransactions", {
      userId: args.userId,
      type: "bonus",
      amount: args.amount,
      balance: newBalance,
      description: args.description,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

// Get token transaction history
export const getTokenHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("tokenTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

// Upgrade subscription
export const upgradeSubscription = mutation({
  args: {
    userId: v.id("users"),
    tier: v.union(v.literal("premium"), v.literal("ultimate")),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const tierLimits = {
      free: 1000,
      premium: 10000,
      ultimate: 100000,
    };

    const now = Date.now();
    const expiresAt = now + args.durationDays * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.userId, {
      subscription: {
        tier: args.tier,
        tokensRemaining: tierLimits[args.tier],
        tokensUsedToday: 0,
        lastTokenRefresh: now,
        expiresAt,
      },
    });

    return { success: true, newTier: args.tier, expiresAt };
  },
});
