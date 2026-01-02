import React, { memo, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { formatDistanceToNow } from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

interface MessageBubbleProps {
  id: Id<"messages">;
  content: string;
  role: "user" | "assistant";
  createdAt: number;
  contentType?: "text" | "image" | "video" | "audio" | "sticker" | "gif";
  media?: {
    url: string;
    type: string;
    thumbnail?: string;
    width?: number;
    height?: number;
  };
  reactions?: Array<{ emoji: string; addedAt: number }>;
  onLongPress?: () => void;
  onReact?: (emoji: string) => void;
  onMediaPress?: (url: string) => void;
}

const QUICK_REACTIONS = ["❤️", "😍", "😂", "😢", "🔥", "👍"];

export const MessageBubble = memo(function MessageBubble({
  id,
  content,
  role,
  createdAt,
  contentType = "text",
  media,
  reactions = [],
  onLongPress,
  onReact,
  onMediaPress,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const timeAgo = useMemo(
    () => formatDistanceToNow(new Date(createdAt), { addSuffix: true }),
    [createdAt]
  );

  const [showReactions, setShowReactions] = React.useState(false);

  const handleLongPress = () => {
    setShowReactions(true);
    onLongPress?.();
  };

  const handleReact = (emoji: string) => {
    onReact?.(emoji);
    setShowReactions(false);
  };

  const renderMedia = () => {
    if (!media) return null;

    if (contentType === "image" || media.type === "image") {
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(media.url)}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: media.url }}
            style={[
              styles.mediaImage,
              {
                aspectRatio: media.width && media.height
                  ? media.width / media.height
                  : 1,
              },
            ]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (contentType === "video" || media.type === "video") {
      return (
        <TouchableOpacity
          onPress={() => onMediaPress?.(media.url)}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: media.thumbnail || media.url }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
          </View>
        </TouchableOpacity>
      );
    }

    if (contentType === "audio" || media.type === "audio") {
      return (
        <TouchableOpacity style={styles.audioContainer}>
          <Ionicons
            name="play-circle"
            size={36}
            color={isUser ? theme.colors.primary[600] : theme.colors.secondary[500]}
          />
          <View style={styles.audioWaveform}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.audioBar,
                  {
                    height: Math.random() * 20 + 5,
                    backgroundColor: isUser
                      ? theme.colors.primary[600]
                      : theme.colors.secondary[500],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.audioDuration}>0:24</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}
    >
      {/* Reaction picker popup */}
      {showReactions && (
        <View
          style={[
            styles.reactionPicker,
            isUser ? styles.reactionPickerRight : styles.reactionPickerLeft,
          ]}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleReact(emoji)}
              style={styles.reactionButton}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Message bubble */}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          media && styles.mediaBubble,
        ]}
      >
        {renderMedia()}

        {content && (
          <Text style={[styles.content, isUser ? styles.userText : styles.assistantText]}>
            {content}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.time, isUser ? styles.userTime : styles.assistantTime]}>
            {timeAgo}
          </Text>
          {isUser && (
            <Ionicons
              name="checkmark-done"
              size={14}
              color={theme.colors.primary[400]}
              style={styles.readIndicator}
            />
          )}
        </View>
      </View>

      {/* Reactions display */}
      {reactions.length > 0 && (
        <View style={[styles.reactions, isUser ? styles.reactionsRight : styles.reactionsLeft]}>
          {reactions.map((reaction, idx) => (
            <View key={idx} style={styles.reactionBadge}>
              <Text style={styles.reactionBadgeEmoji}>{reaction.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Close reactions picker when tapping outside */}
      {showReactions && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowReactions(false)}
        />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: "80%",
  },
  userContainer: {
    alignSelf: "flex-end",
  },
  assistantContainer: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    ...theme.shadows.sm,
  },
  userBubble: {
    backgroundColor: theme.colors.primary[500],
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: theme.colors.dark.card,
    borderBottomLeftRadius: 6,
  },
  mediaBubble: {
    padding: 4,
    overflow: "hidden",
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#ffffff",
  },
  assistantText: {
    color: theme.colors.text.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  time: {
    fontSize: 10,
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
  },
  assistantTime: {
    color: theme.colors.text.muted,
  },
  readIndicator: {
    marginLeft: 4,
  },
  mediaContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 6,
  },
  mediaImage: {
    width: "100%",
    minWidth: 200,
    maxHeight: 300,
    borderRadius: 16,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 180,
  },
  audioWaveform: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
    gap: 2,
  },
  audioBar: {
    width: 3,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  reactionPicker: {
    position: "absolute",
    top: -50,
    flexDirection: "row",
    backgroundColor: theme.colors.dark.tertiary,
    borderRadius: 24,
    padding: 6,
    zIndex: 100,
    ...theme.shadows.md,
  },
  reactionPickerLeft: {
    left: 0,
  },
  reactionPickerRight: {
    right: 0,
  },
  reactionButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactions: {
    flexDirection: "row",
    marginTop: 4,
  },
  reactionsLeft: {
    justifyContent: "flex-start",
  },
  reactionsRight: {
    justifyContent: "flex-end",
  },
  reactionBadge: {
    backgroundColor: theme.colors.dark.tertiary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginHorizontal: 2,
    ...theme.shadows.sm,
  },
  reactionBadgeEmoji: {
    fontSize: 14,
  },
});
