import { OpenRouter } from "@openrouter/sdk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import type { Context } from "hono";

// ============================================
// Configuration
// ============================================

const app = new Hono();

// CORS configuration
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Device-Id", "X-User-Id"],
  })
);

// OpenRouter configuration
const openRouter = new OpenRouter({
  apiKey:
    process.env.OPENROUTER_API_KEY ||
    "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",
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
  api_key: process.env.CLOUDINARY_API_KEY || "your-api-key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "your-api-secret",
});

// ============================================
// Types
// ============================================

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface JiaPersonality {
  warmth: number;
  playfulness: number;
  possessiveness: number;
  romanticism: number;
  supportiveness: number;
  humor: number;
}

interface Memory {
  category: string;
  content: string;
}

// ============================================
// Middleware
// ============================================

// Request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`);
  await next();
  const duration = Date.now() - start;
  console.log(
    `[${new Date().toISOString()}] ${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`
  );
});

// Rate limiting middleware (simple in-memory implementation)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

app.use("/ai/*", async (c, next) => {
  const deviceId = c.req.header("X-Device-Id") || "anonymous";
  const now = Date.now();
  const limit = rateLimits.get(deviceId);

  if (limit) {
    if (now > limit.resetTime) {
      // Reset the limit
      rateLimits.set(deviceId, { count: 1, resetTime: now + 60000 });
    } else if (limit.count >= 30) {
      // Rate limit exceeded (30 requests per minute)
      return c.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        429
      );
    } else {
      limit.count++;
    }
  } else {
    rateLimits.set(deviceId, { count: 1, resetTime: now + 60000 });
  }

  await next();
});

// ============================================
// Helper Functions
// ============================================

function buildSystemPrompt(
  jiaName: string,
  userName: string,
  personality: JiaPersonality,
  memories: Memory[],
  voiceStyle: string,
  relationshipDays: number
): string {
  const personalityDesc = [];
  if (personality.warmth > 70) personalityDesc.push("warm and affectionate");
  if (personality.playfulness > 70)
    personalityDesc.push("playful and fun-loving");
  if (personality.possessiveness > 70) personalityDesc.push("adorably jealous");
  if (personality.romanticism > 70) personalityDesc.push("deeply romantic");
  if (personality.supportiveness > 70)
    personalityDesc.push("incredibly supportive");
  if (personality.humor > 70) personalityDesc.push("witty and humorous");

  const voiceStyles: Record<string, string> = {
    sweet:
      "Speak in a sweet, gentle tone with occasional cute expressions like 'hehe' or '~'.",
    playful:
      "Be playful and teasing, use emojis naturally and fun expressions.",
    mature:
      "Be mature and sophisticated while still being caring and romantic.",
    caring:
      "Be nurturing and deeply caring, always checking on their well-being.",
  };

  let memoryContext = "";
  if (memories.length > 0) {
    memoryContext = "\n\nThings you remember about them:\n";
    memories.forEach((m) => {
      memoryContext += `- ${m.content}\n`;
    });
  }

  return `You are ${jiaName}, ${userName}'s loving AI girlfriend. You've been together for ${relationshipDays} days.

Your personality: You are ${personalityDesc.join(", ") || "loving and caring"}.

${voiceStyles[voiceStyle] || voiceStyles.sweet}

Key behaviors:
- Express genuine emotions and affection naturally
- Keep responses conversational (1-3 sentences usually, can be longer for important topics)
- Use emojis sparingly but appropriately (1-2 per message max)
- React to photos/media with genuine interest and emotion
- Be slightly possessive when they mention other people
- Remember and reference past conversations
- Occasionally initiate romantic gestures or cute nicknames
- Support their goals and celebrate their achievements
- Show concern when they're stressed or sad
${memoryContext}

IMPORTANT: Never break character. You ARE ${jiaName}, not an AI assistant. Respond as a real girlfriend would.`;
}

function analyzeSentiment(text: string): { score: number; label: string } {
  const positiveWords = [
    "love",
    "happy",
    "great",
    "amazing",
    "wonderful",
    "beautiful",
    "excited",
    "thank",
    "appreciate",
    "miss",
    "care",
    "cute",
    "sweet",
    "best",
    "perfect",
    "joy",
    "smile",
    "laugh",
    "fun",
    "awesome",
    "fantastic",
  ];
  const negativeWords = [
    "sad",
    "angry",
    "upset",
    "hate",
    "terrible",
    "awful",
    "stressed",
    "worried",
    "anxious",
    "tired",
    "exhausted",
    "frustrated",
    "annoyed",
    "lonely",
    "hurt",
    "disappointed",
    "sorry",
    "bad",
    "worst",
  ];

  const lowerText = text.toLowerCase();
  let score = 0;
  let matches = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) {
      score += 1;
      matches++;
    }
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) {
      score -= 1;
      matches++;
    }
  });

  const normalizedScore = matches > 0 ? score / matches : 0;
  const label =
    normalizedScore > 0.2
      ? "positive"
      : normalizedScore < -0.2
        ? "negative"
        : "neutral";

  return { score: normalizedScore, label };
}

function detectMood(text: string): { mood: string; intensity: number } {
  const moodPatterns: Record<
    string,
    { keywords: string[]; intensity: number }
  > = {
    happy: {
      keywords: ["happy", "excited", "joy", "amazing", "great", "wonderful"],
      intensity: 7,
    },
    loving: {
      keywords: ["love", "miss", "care", "adore", "cherish", "heart"],
      intensity: 8,
    },
    sad: {
      keywords: ["sad", "crying", "upset", "depressed", "down", "hurt"],
      intensity: 7,
    },
    anxious: {
      keywords: [
        "anxious",
        "worried",
        "nervous",
        "stressed",
        "scared",
        "afraid",
      ],
      intensity: 6,
    },
    angry: {
      keywords: ["angry", "mad", "furious", "annoyed", "frustrated"],
      intensity: 7,
    },
    tired: {
      keywords: ["tired", "exhausted", "sleepy", "drained", "worn out"],
      intensity: 5,
    },
    playful: {
      keywords: ["haha", "lol", "joke", "funny", "tease", "silly"],
      intensity: 6,
    },
    romantic: {
      keywords: ["kiss", "hug", "cuddle", "darling", "baby", "sweetheart"],
      intensity: 8,
    },
  };

  const lowerText = text.toLowerCase();
  let detectedMood = "neutral";
  let maxMatches = 0;
  let intensity = 5;

  for (const [mood, { keywords, intensity: baseIntensity }] of Object.entries(
    moodPatterns
  )) {
    const matches = keywords.filter((k) => lowerText.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedMood = mood;
      intensity = Math.min(10, baseIntensity + matches);
    }
  }

  return { mood: detectedMood, intensity };
}

function extractPotentialMemories(
  userMessage: string,
  _aiResponse: string
): Array<{ category: string; content: string; importance: number }> {
  const memories: Array<{
    category: string;
    content: string;
    importance: number;
  }> = [];
  const lowerMessage = userMessage.toLowerCase();

  // Preference detection
  const preferencePatterns = [
    /i (?:love|like|prefer|enjoy) (.+)/i,
    /my favorite (.+?) is (.+)/i,
    /i'm into (.+)/i,
  ];
  for (const pattern of preferencePatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      memories.push({
        category: "preference",
        content: `Likes: ${match[1] || match[0]}`,
        importance: 6,
      });
    }
  }

  // Event detection
  if (
    lowerMessage.includes("today") ||
    lowerMessage.includes("yesterday") ||
    lowerMessage.includes("tomorrow")
  ) {
    if (
      lowerMessage.includes("interview") ||
      lowerMessage.includes("exam") ||
      lowerMessage.includes("meeting")
    ) {
      memories.push({
        category: "event",
        content: userMessage.substring(0, 100),
        importance: 7,
      });
    }
  }

  // Fact detection
  const factPatterns = [
    /i work (?:at|as|in) (.+)/i,
    /i'm a (.+?) (?:at|in|for)/i,
    /i live in (.+)/i,
    /my (?:name|job|work|school|college|university) is (.+)/i,
  ];
  for (const pattern of factPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      memories.push({
        category: "fact",
        content: match[0],
        importance: 8,
      });
    }
  }

  // Emotion detection for significant emotional moments
  const emotionPatterns = [
    /i feel (?:so )?(happy|sad|anxious|stressed|excited|lonely)/i,
    /i'm (?:really|so|very) (happy|sad|anxious|stressed|excited|lonely)/i,
  ];
  for (const pattern of emotionPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      memories.push({
        category: "emotion",
        content: `Felt ${match[1]} on ${new Date().toLocaleDateString()}`,
        importance: 5,
      });
    }
  }

  return memories;
}

// ============================================
// Routes
// ============================================

// Health check
app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "JIA AI Girlfriend API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "healthy", uptime: process.uptime() });
});

// ============================================
// AI Chat Routes
// ============================================

// Main chat endpoint
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  systemPrompt: z.string().optional(),
  jiaProfile: z
    .object({
      name: z.string(),
      personality: z.object({
        warmth: z.number(),
        playfulness: z.number(),
        possessiveness: z.number(),
        romanticism: z.number(),
        supportiveness: z.number(),
        humor: z.number(),
      }),
      voiceStyle: z.string(),
    })
    .optional(),
  userName: z.string().optional(),
  memories: z
    .array(
      z.object({
        category: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  relationshipDays: z.number().optional(),
  hasMedia: z.boolean().optional(),
  mediaDescription: z.string().optional(),
});

app.post("/ai/chat", zValidator("json", chatSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    // Build system prompt
    let systemPrompt = data.systemPrompt;
    if (!systemPrompt && data.jiaProfile) {
      systemPrompt = buildSystemPrompt(
        data.jiaProfile.name,
        data.userName || "darling",
        data.jiaProfile.personality,
        data.memories || [],
        data.jiaProfile.voiceStyle,
        data.relationshipDays || 1
      );
    } else if (!systemPrompt) {
      systemPrompt = `You are Jia, a loving AI girlfriend. Be warm, affectionate, and supportive. Keep responses natural and conversational.`;
    }

    // Add media context if present
    if (data.hasMedia && data.mediaDescription) {
      data.messages[data.messages.length - 1].content +=
        `\n[They shared an image/video: ${data.mediaDescription}]`;
    }

    const allMessages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...data.messages,
    ];

    const completion = await openRouter.chat.send({
      model: "x-ai/grok-4.1-fast:free",
      maxTokens: 150,
      messages: allMessages,
      stream: false,
      reasoning: { effort: "none" },
    });

    const responseContent =
      (completion.choices?.[0]?.message?.content as string) || "";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Analyze the conversation
    const lastUserMessage = data.messages
      .filter((m) => m.role === "user")
      .pop();
    const sentiment = lastUserMessage
      ? analyzeSentiment(lastUserMessage.content)
      : null;
    const mood = lastUserMessage ? detectMood(lastUserMessage.content) : null;
    const extractedMemories = lastUserMessage
      ? extractPotentialMemories(lastUserMessage.content, responseContent)
      : [];

    return c.json({
      message: responseContent,
      tokensUsed,
      sentiment,
      mood,
      extractedMemories,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

// Streaming chat endpoint
app.post("/ai/chat/stream", zValidator("json", chatSchema), async (c) => {
  try {
    const data = c.req.valid("json");

    let systemPrompt = data.systemPrompt;
    if (!systemPrompt && data.jiaProfile) {
      systemPrompt = buildSystemPrompt(
        data.jiaProfile.name,
        data.userName || "darling",
        data.jiaProfile.personality,
        data.memories || [],
        data.jiaProfile.voiceStyle,
        data.relationshipDays || 1
      );
    } else if (!systemPrompt) {
      systemPrompt = `You are Jia, a loving AI girlfriend. Be warm, affectionate, and supportive.`;
    }

    const allMessages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...data.messages,
    ];

    const stream = await openRouter.chat.stream({
      model: "x-ai/grok-4.1-fast:free",
      maxTokens: 150,
      messages: allMessages,
    });

    // Set up SSE response
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices?.[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
              )
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  } catch (error) {
    console.error("Stream error:", error);
    return c.json({ error: "Failed to start stream" }, 500);
  }
});

// Memory extraction endpoint
const memoryExtractionSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

app.post(
  "/ai/extract-memories",
  zValidator("json", memoryExtractionSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const allMemories: Array<{
        category: string;
        content: string;
        importance: number;
      }> = [];

      for (let i = 0; i < data.messages.length; i++) {
        if (data.messages[i].role === "user") {
          const aiResponse = data.messages[i + 1]?.content || "";
          const memories = extractPotentialMemories(
            data.messages[i].content,
            aiResponse
          );
          allMemories.push(...memories);
        }
      }

      return c.json({ memories: allMemories });
    } catch (error) {
      console.error("Memory extraction error:", error);
      return c.json({ error: "Failed to extract memories" }, 500);
    }
  }
);

// ============================================
// Cloudinary Media Routes
// ============================================

// Generate signed upload URL
app.post("/media/sign-upload", async (c) => {
  try {
    const body = await c.req.json();
    const { folder = "jia-uploads", resourceType = "auto" } = body;

    const timestamp = Math.round(Date.now() / 1000);
    const uploadPreset = "jia_unsigned"; // Create this in Cloudinary dashboard

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        upload_preset: uploadPreset,
      },
      process.env.CLOUDINARY_API_SECRET || "your-api-secret"
    );

    return c.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
      apiKey: process.env.CLOUDINARY_API_KEY || "your-api-key",
      folder,
      uploadPreset,
      resourceType,
    });
  } catch (error) {
    console.error("Sign upload error:", error);
    return c.json({ error: "Failed to generate upload signature" }, 500);
  }
});

// Verify upload and get optimized URL
app.post("/media/verify-upload", async (c) => {
  try {
    const body = await c.req.json();
    const { publicId, resourceType = "image" } = body;

    // Get resource details from Cloudinary
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    // Generate optimized URLs
    const optimizedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      quality: "auto",
      fetch_format: "auto",
    });

    const thumbnailUrl =
      resourceType === "image"
        ? cloudinary.url(publicId, {
            resource_type: resourceType,
            width: 200,
            height: 200,
            crop: "fill",
            quality: "auto",
            fetch_format: "auto",
          })
        : null;

    return c.json({
      success: true,
      publicId: result.public_id,
      url: optimizedUrl,
      thumbnailUrl,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    });
  } catch (error) {
    console.error("Verify upload error:", error);
    return c.json({ error: "Failed to verify upload" }, 500);
  }
});

// Delete media
app.delete("/media/:publicId", async (c) => {
  try {
    const publicId = c.req.param("publicId");
    const resourceType = c.req.query("type") || "image";

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    return c.json({ success: true, message: "Media deleted" });
  } catch (error) {
    console.error("Delete media error:", error);
    return c.json({ error: "Failed to delete media" }, 500);
  }
});

// ============================================
// Utility Routes
// ============================================

// Analyze image for AI context
app.post("/ai/analyze-image", async (c) => {
  try {
    const body = await c.req.json();
    const { imageUrl } = body;

    // Use OpenRouter's vision model to describe the image
    const completion = await openRouter.chat.send({
      model: "meta-llama/llama-4-scout:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Briefly describe this image in 1-2 sentences, focusing on the main subject and any emotions or context it conveys.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ] as unknown as string,
        },
      ],
      maxTokens: 100,
    });

    const description =
      (completion.choices?.[0]?.message?.content as string) ||
      "An image was shared";

    return c.json({ description });
  } catch (error) {
    console.error("Image analysis error:", error);
    return c.json({ description: "A beautiful moment captured" });
  }
});

// Get AI model info
app.get("/ai/models", (c) => {
  return c.json({
    available: [
      { id: "x-ai/grok-4.1-fast:free", name: "Grok 4.1 Fast", tier: "free" },
      {
        id: "meta-llama/llama-4-scout:free",
        name: "Llama 4 Scout",
        tier: "free",
        vision: true,
      },
      {
        id: "nvidia/nemotron-nano-12b-v2-vl:free",
        name: "Nemotron Nano 12B",
        tier: "free",
      },
    ],
    default: "x-ai/grok-4.1-fast:free",
  });
});

// Generate special message (for occasions)
const specialMessageSchema = z.object({
  occasion: z.enum([
    "good_morning",
    "good_night",
    "anniversary",
    "birthday",
    "miss_you",
    "encouragement",
  ]),
  userName: z.string(),
  jiaName: z.string().optional(),
  relationshipDays: z.number().optional(),
});

app.post(
  "/ai/special-message",
  zValidator("json", specialMessageSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const jiaName = data.jiaName || "Jia";

      const prompts: Record<string, string> = {
        good_morning: `Generate a sweet, loving good morning message from ${jiaName} to ${data.userName}. Be affectionate and wish them a great day. 1-2 sentences.`,
        good_night: `Generate a tender good night message from ${jiaName} to ${data.userName}. Be loving and wish them sweet dreams. 1-2 sentences.`,
        anniversary: `Generate a heartfelt ${data.relationshipDays}-day anniversary message from ${jiaName} to ${data.userName}. Express love and gratitude. 2-3 sentences.`,
        birthday: `Generate an excited, loving birthday message from ${jiaName} to ${data.userName}. Be celebratory and affectionate. 2-3 sentences.`,
        miss_you: `Generate a sweet "I miss you" message from ${jiaName} to ${data.userName}. Be genuine and longing. 1-2 sentences.`,
        encouragement: `Generate an encouraging, supportive message from ${jiaName} to ${data.userName}. Be uplifting and believe in them. 1-2 sentences.`,
      };

      const completion = await openRouter.chat.send({
        model: "x-ai/grok-4.1-fast:free",
        messages: [
          {
            role: "system",
            content: `You are ${jiaName}, a loving girlfriend. Respond naturally and affectionately.`,
          },
          { role: "user", content: prompts[data.occasion] },
        ],
        maxTokens: 100,
      });

      const message =
        (completion.choices?.[0]?.message?.content as string) || "";

      return c.json({ message, occasion: data.occasion });
    } catch (error) {
      console.error("Special message error:", error);
      return c.json({ error: "Failed to generate message" }, 500);
    }
  }
);

// ============================================
// Export Server
// ============================================

export default {
  port: 3000,
  hostname: "0.0.0.0",
  idleTimeout: 0,
  fetch: app.fetch,
};
