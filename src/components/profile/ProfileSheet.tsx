import React, { memo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import {
  useJiaProfile,
  useRelationshipStats,
  useUpdateJiaPersonality,
  useMemoryStats,
} from "../../hooks/useConvex";
import Slider from "@react-native-community/slider";

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileSheet = memo(function ProfileSheet({
  visible,
  onClose,
}: ProfileSheetProps) {
  const jiaProfile = useJiaProfile();
  const relationshipStats = useRelationshipStats();
  const memoryStats = useMemoryStats();
  const updatePersonality = useUpdateJiaPersonality();

  const [editMode, setEditMode] = useState(false);
  const [personality, setPersonality] = useState(jiaProfile?.personality || {
    warmth: 85,
    playfulness: 75,
    possessiveness: 70,
    romanticism: 80,
    supportiveness: 90,
    humor: 70,
  });

  const handleSavePersonality = async () => {
    await updatePersonality(personality);
    setEditMode(false);
  };

  const PersonalitySlider = ({
    label,
    value,
    emoji,
    onValueChange,
  }: {
    label: string;
    value: number;
    emoji: string;
    onValueChange: (value: number) => void;
  }) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderEmoji}>{emoji}</Text>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{Math.round(value)}%</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={theme.colors.primary[500]}
        maximumTrackTintColor={theme.colors.dark.border}
        thumbTintColor={theme.colors.primary[400]}
        disabled={!editMode}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          >
            {/* Profile Header */}
            <View style={styles.header}>
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
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.name}>{jiaProfile?.name || "Jia"}</Text>
              <Text style={styles.subtitle}>Your AI Girlfriend 💕</Text>
            </View>

            {/* Relationship Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {relationshipStats?.relationshipDuration.days || 0}
                </Text>
                <Text style={styles.statLabel}>Days Together</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {relationshipStats?.totalMessages || 0}
                </Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{memoryStats?.total || 0}</Text>
                <Text style={styles.statLabel}>Memories</Text>
              </View>
            </View>

            {/* Personality Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personality</Text>
                <TouchableOpacity
                  onPress={() => (editMode ? handleSavePersonality() : setEditMode(true))}
                >
                  <Text style={styles.editButton}>{editMode ? "Save" : "Edit"}</Text>
                </TouchableOpacity>
              </View>

              <PersonalitySlider
                label="Warmth"
                value={personality.warmth}
                emoji="🥰"
                onValueChange={(v) => setPersonality({ ...personality, warmth: v })}
              />
              <PersonalitySlider
                label="Playfulness"
                value={personality.playfulness}
                emoji="😜"
                onValueChange={(v) => setPersonality({ ...personality, playfulness: v })}
              />
              <PersonalitySlider
                label="Possessiveness"
                value={personality.possessiveness}
                emoji="💋"
                onValueChange={(v) => setPersonality({ ...personality, possessiveness: v })}
              />
              <PersonalitySlider
                label="Romanticism"
                value={personality.romanticism}
                emoji="💖"
                onValueChange={(v) => setPersonality({ ...personality, romanticism: v })}
              />
              <PersonalitySlider
                label="Supportiveness"
                value={personality.supportiveness}
                emoji="🤗"
                onValueChange={(v) => setPersonality({ ...personality, supportiveness: v })}
              />
              <PersonalitySlider
                label="Humor"
                value={personality.humor}
                emoji="😂"
                onValueChange={(v) => setPersonality({ ...personality, humor: v })}
              />
            </View>

            {/* Interests */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.tagsContainer}>
                {(jiaProfile?.interests || []).map((interest, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Voice Style */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voice Style</Text>
              <View style={styles.voiceStyles}>
                {["sweet", "playful", "mature", "caring"].map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.voiceOption,
                      jiaProfile?.voiceStyle === style && styles.voiceOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.voiceOptionText,
                        jiaProfile?.voiceStyle === style && styles.voiceOptionTextActive,
                      ]}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
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
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 64,
    backgroundColor: theme.colors.primary[500],
    opacity: 0.3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary[400],
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: theme.colors.dark.card,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary[400],
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.dark.border,
  },
  section: {
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  editButton: {
    fontSize: 14,
    color: theme.colors.primary[400],
    fontWeight: "600",
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sliderLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  sliderValue: {
    fontSize: 14,
    color: theme.colors.primary[400],
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.dark.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  voiceStyles: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  voiceOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.dark.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  voiceOptionActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[400],
  },
  voiceOptionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },
  voiceOptionTextActive: {
    color: "#fff",
  },
});
