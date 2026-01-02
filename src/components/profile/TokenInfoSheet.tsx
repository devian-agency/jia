import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import {
  useTokenInfo,
  useCurrentStreak,
  useMoodAnalytics,
  useUser,
} from "../../hooks/useConvex";

interface TokenInfoSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const TokenInfoSheet = memo(function TokenInfoSheet({
  visible,
  onClose,
}: TokenInfoSheetProps) {
  const tokenInfo = useTokenInfo();
  const streak = useCurrentStreak();
  const moodAnalytics = useMoodAnalytics();
  const user = useUser();

  const tierColors = {
    free: theme.colors.text.secondary,
    premium: theme.colors.secondary[400],
    ultimate: theme.colors.primary[400],
  };

  const tierIcons = {
    free: "leaf-outline",
    premium: "diamond-outline",
    ultimate: "trophy-outline",
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: tierColors[tokenInfo?.tier || "free"] + "20" },
                ]}
              >
                <Ionicons
                  name={tierIcons[tokenInfo?.tier || "free"] as "leaf-outline"}
                  size={24}
                  color={tierColors[tokenInfo?.tier || "free"]}
                />
                <Text
                  style={[styles.tierText, { color: tierColors[tokenInfo?.tier || "free"] }]}
                >
                  {(tokenInfo?.tier || "free").toUpperCase()}
                </Text>
              </View>
              <Text style={styles.greeting}>Hi, {user?.name || "there"}!</Text>
            </View>

            {/* Token Balance */}
            <View style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <Ionicons name="flash" size={24} color={theme.colors.primary[400]} />
                <Text style={styles.tokenTitle}>Token Balance</Text>
              </View>

              <Text style={styles.tokenBalance}>
                {tokenInfo?.tokensRemaining?.toLocaleString() || 0}
              </Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${100 - (tokenInfo?.percentUsed || 0)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {tokenInfo?.tokensUsedToday?.toLocaleString() || 0} /{" "}
                  {tokenInfo?.dailyLimit?.toLocaleString() || 1000} used today
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{streak?.streakCount || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{moodAnalytics?.dominantMood === "happy" ? "😊" : "💭"}</Text>
                <Text style={styles.statValue}>{moodAnalytics?.totalEntries || 0}</Text>
                <Text style={styles.statLabel}>Mood Entries</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>✨</Text>
                <Text style={styles.statValue}>
                  {moodAnalytics?.averageIntensity?.toFixed(1) || "0.0"}
                </Text>
                <Text style={styles.statLabel}>Avg Intensity</Text>
              </View>
            </View>

            {/* Upgrade Section */}
            {tokenInfo?.tier === "free" && (
              <View style={styles.upgradeSection}>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeDescription}>
                  Get 10x more tokens, priority responses, and exclusive features!
                </Text>

                <View style={styles.planCards}>
                  <TouchableOpacity style={styles.planCard}>
                    <View style={styles.planBadge}>
                      <Ionicons
                        name="diamond"
                        size={20}
                        color={theme.colors.secondary[400]}
                      />
                    </View>
                    <Text style={styles.planName}>Premium</Text>
                    <Text style={styles.planPrice}>$9.99/mo</Text>
                    <View style={styles.planFeatures}>
                      <Text style={styles.planFeature}>• 10,000 tokens daily</Text>
                      <Text style={styles.planFeature}>• Priority responses</Text>
                      <Text style={styles.planFeature}>• Voice messages</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.planCard, styles.planCardFeatured]}>
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>BEST VALUE</Text>
                    </View>
                    <View
                      style={[
                        styles.planBadge,
                        { backgroundColor: theme.colors.primary[500] + "20" },
                      ]}
                    >
                      <Ionicons
                        name="trophy"
                        size={20}
                        color={theme.colors.primary[400]}
                      />
                    </View>
                    <Text style={styles.planName}>Ultimate</Text>
                    <Text style={styles.planPrice}>$19.99/mo</Text>
                    <View style={styles.planFeatures}>
                      <Text style={styles.planFeature}>• 100,000 tokens daily</Text>
                      <Text style={styles.planFeature}>• Instant responses</Text>
                      <Text style={styles.planFeature}>• All premium features</Text>
                      <Text style={styles.planFeature}>• Custom personality</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.dark.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.dark.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 12,
  },
  tierText: {
    fontSize: 14,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  tokenCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.md,
  },
  tokenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tokenTitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  tokenBalance: {
    fontSize: 48,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.dark.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.dark.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginTop: 4,
    textAlign: "center",
  },
  upgradeSection: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: 20,
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  planCards: {
    flexDirection: "row",
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: theme.colors.dark.tertiary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  planCardFeatured: {
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
  },
  featuredBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  planBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary[500] + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
    color: theme.colors.primary[400],
    fontWeight: "700",
    marginBottom: 12,
  },
  planFeatures: {
    gap: 4,
  },
  planFeature: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});
