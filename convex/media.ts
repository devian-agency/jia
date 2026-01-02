import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create media upload record
export const createUpload = mutation({
  args: {
    userId: v.id("users"),
    originalFileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const uploadId = await ctx.db.insert("mediaUploads", {
      userId: args.userId,
      status: "pending",
      originalFileName: args.originalFileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      uploadProgress: 0,
      createdAt: Date.now(),
    });

    return await ctx.db.get(uploadId);
  },
});

// Update upload progress
export const updateProgress = mutation({
  args: {
    uploadId: v.id("mediaUploads"),
    progress: v.number(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      uploadProgress: args.progress,
    };

    if (args.status) {
      updates.status = args.status;
    }

    await ctx.db.patch(args.uploadId, updates);
    return await ctx.db.get(args.uploadId);
  },
});

// Complete upload with Cloudinary details
export const completeUpload = mutation({
  args: {
    uploadId: v.id("mediaUploads"),
    cloudinaryPublicId: v.string(),
    cloudinaryUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uploadId, {
      status: "completed",
      cloudinaryPublicId: args.cloudinaryPublicId,
      cloudinaryUrl: args.cloudinaryUrl,
      uploadProgress: 100,
      completedAt: Date.now(),
    });

    return await ctx.db.get(args.uploadId);
  },
});

// Mark upload as failed
export const failUpload = mutation({
  args: {
    uploadId: v.id("mediaUploads"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uploadId, {
      status: "failed",
      error: args.error,
    });

    return await ctx.db.get(args.uploadId);
  },
});

// Get upload status
export const getUpload = query({
  args: { uploadId: v.id("mediaUploads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.uploadId);
  },
});

// Get user's upload history
export const getUserUploads = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("uploading"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let uploads = await ctx.db
      .query("mediaUploads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (args.status) {
      uploads = uploads.filter((u) => u.status === args.status);
    }

    if (args.limit) {
      uploads = uploads.slice(0, args.limit);
    }

    return uploads;
  },
});

// Delete upload record
export const deleteUpload = mutation({
  args: { uploadId: v.id("mediaUploads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.uploadId);
    return { success: true };
  },
});

// Get storage stats
export const getStorageStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const uploads = await ctx.db
      .query("mediaUploads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const completedUploads = uploads.filter((u) => u.status === "completed");
    const totalSize = completedUploads.reduce((sum, u) => sum + u.fileSize, 0);

    const byType: Record<string, { count: number; size: number }> = {};
    for (const upload of completedUploads) {
      const type = upload.mimeType.split("/")[0];
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count++;
      byType[type].size += upload.fileSize;
    }

    return {
      totalFiles: completedUploads.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      byType,
      pendingUploads: uploads.filter(
        (u) => u.status === "pending" || u.status === "uploading"
      ).length,
      failedUploads: uploads.filter((u) => u.status === "failed").length,
    };
  },
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
