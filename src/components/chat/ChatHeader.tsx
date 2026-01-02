import React, { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { useJiaProfile, useCurrentStreak, useUnreadCount } from "../../hooks/useConvex";
import { useUIStore } from "../../stores";

interface ChatHeaderProps {
  onProfilePress?: () => void;
  onMenuPress?: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  onProfilePress,
  onMenuPress,
}: ChatHeaderProps) {
  const jiaProfile = useJiaProfile();
  const streak = useCurrentStreak();
  const unreadCount = useUnreadCount();
  const { setProfileSheetOpen } = useUIStore();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      setProfileSheetOpen(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient overlay */}
      <View style={styles.gradientOverlay} />

      {/* Profile Section */}
      <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow} />
          <Image
            source={
              jiaProfile?.avatar
                ? { uri: jiaProfile.avatar }
                : require("../../assets/profile.jpg")
            }
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{jiaProfile?.name || "Jia"}</Text>
            {streak && streak.streakCount > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{streak.streakCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online • Always here for you</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onMenuPress}>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.dark.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark.border,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatarGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[500],
    opacity: 0.3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary[400],
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.dark.secondary,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: theme.colors.dark.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  streakEmoji: {
    fontSize: 10,
  },
  streakCount: {
    fontSize: 10,
    fontWeight: "600",
    color: theme.colors.accent[400],
    marginLeft: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.tertiary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: theme.colors.accent[500],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
});
