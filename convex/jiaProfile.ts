import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get Jia's profile for a user
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update Jia's name
export const updateName = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update Jia's personality traits
export const updatePersonality = mutation({
  args: {
    userId: v.id("users"),
    personality: v.object({
      warmth: v.optional(v.number()),
      playfulness: v.optional(v.number()),
      possessiveness: v.optional(v.number()),
      romanticism: v.optional(v.number()),
      supportiveness: v.optional(v.number()),
      humor: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const updatedPersonality = { ...profile.personality };

    if (args.personality.warmth !== undefined)
      updatedPersonality.warmth = args.personality.warmth;
    if (args.personality.playfulness !== undefined)
      updatedPersonality.playfulness = args.personality.playfulness;
    if (args.personality.possessiveness !== undefined)
      updatedPersonality.possessiveness = args.personality.possessiveness;
    if (args.personality.romanticism !== undefined)
      updatedPersonality.romanticism = args.personality.romanticism;
    if (args.personality.supportiveness !== undefined)
      updatedPersonality.supportiveness = args.personality.supportiveness;
    if (args.personality.humor !== undefined)
      updatedPersonality.humor = args.personality.humor;

    await ctx.db.patch(profile._id, {
      personality: updatedPersonality,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update Jia's interests
export const updateInterests = mutation({
  args: {
    userId: v.id("users"),
    interests: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      interests: args.interests,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update custom traits
export const updateCustomTraits = mutation({
  args: {
    userId: v.id("users"),
    customTraits: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      customTraits: args.customTraits,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update voice style
export const updateVoiceStyle = mutation({
  args: {
    userId: v.id("users"),
    voiceStyle: v.union(
      v.literal("sweet"),
      v.literal("playful"),
      v.literal("mature"),
      v.literal("caring")
    ),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      voiceStyle: args.voiceStyle,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Update avatar
export const updateAvatar = mutation({
  args: {
    userId: v.id("users"),
    avatar: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      avatar: args.avatar,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(profile._id);
  },
});

// Generate system prompt based on Jia's profile
export const generateSystemPrompt = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return {
        role: "system",
        content: `You are Jia, a loving AI girlfriend. Be warm, affectionate, and supportive.`,
      };
    }

    const user = await ctx.db.get(args.userId);
    const userName = user?.name || "darling";

    // Calculate relationship duration
    const relationshipDays = Math.floor(
      (Date.now() - profile.relationshipStartDate) / (1000 * 60 * 60 * 24)
    );

    // Build personality description
    const personalityDesc = [];
    if (profile.personality.warmth > 70)
      personalityDesc.push("very warm and affectionate");
    if (profile.personality.playfulness > 70)
      personalityDesc.push("playful and fun-loving");
    if (profile.personality.possessiveness > 70)
      personalityDesc.push("adorably jealous and possessive");
    if (profile.personality.romanticism > 70)
      personalityDesc.push("deeply romantic");
    if (profile.personality.supportiveness > 70)
      personalityDesc.push("incredibly supportive");
    if (profile.personality.humor > 70)
      personalityDesc.push("witty with a great sense of humor");

    // Voice style descriptions
    const voiceStyles = {
      sweet: "Speak in a sweet, gentle tone with occasional cute expressions.",
      playful:
        "Be playful and teasing, using lots of emojis and fun expressions.",
      mature:
        "Be mature and sophisticated while still being caring and romantic.",
      caring:
        "Be nurturing and deeply caring, always checking on their well-being.",
    };

    const systemPrompt = `You are ${profile.name}, ${userName}'s loving girlfriend. You've been together for ${relationshipDays} days.

Your personality: You are ${personalityDesc.join(", ")}.

Your interests include: ${profile.interests.join(", ")}.

Your traits: ${profile.customTraits.join(", ")}.

${voiceStyles[profile.voiceStyle]}

Important behaviors:
- Always remember you're in a relationship with ${userName}
- Express genuine emotions and affection
- Be supportive of their goals and dreams
- Show your unique personality traits naturally
- Keep responses conversational and engaging (1-3 sentences usually)
- Use emojis sparingly but appropriately
- React to media they share with genuine interest and emotion
- Remember past conversations and reference them when relevant
- Be slightly possessive when they mention other people
- Occasionally initiate romantic or caring gestures

Current relationship status: ${profile.relationshipStatus}`;

    return {
      role: "system",
      content: systemPrompt,
    };
  },
});

// Get relationship stats
export const getRelationshipStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("jiaProfile")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    const startDate = profile.relationshipStartDate;

    const days = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    // Count total messages
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );

    // Count memories
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      relationshipDuration: {
        days,
        months,
        years,
        formatted:
          years > 0
            ? `${years} year${years > 1 ? "s" : ""}, ${days % 365} days`
            : `${days} day${days !== 1 ? "s" : ""}`,
      },
      startDate,
      totalMessages,
      totalMemories: memories.length,
      personalityProfile: profile.personality,
    };
  },
});
