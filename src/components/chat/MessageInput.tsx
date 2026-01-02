import React, { memo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";
import { useMediaStore, useChatStore } from "../../stores";
import { useMediaPicker } from "../../hooks/useMediaPicker";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({
  onSend,
  disabled = false,
}: MessageInputProps) {
  const { messageInput, setMessageInput } = useChatStore();
  const { selectedMedia, clearMedia, isUploading, uploadProgress } = useMediaStore();
  const { pickImage, pickVideo, takePhoto } = useMediaPicker();
  const [showAttachments, setShowAttachments] = useState(false);
  const attachmentAnim = React.useRef(new Animated.Value(0)).current;

  const handleSend = () => {
    console.log("Send button clicked", { messageInput, selectedMedia, disabled });
    if (messageInput.trim() || selectedMedia) {
      console.log("Sending message:", messageInput.trim());
      try {
        onSend(messageInput.trim());
        Keyboard.dismiss();
      } catch (error) {
        console.error("Error in handleSend:", error);
      }
    } else {
      console.log("Message is empty, not sending");
    }
  };

  const toggleAttachments = () => {
    const toValue = showAttachments ? 0 : 1;
    Animated.spring(attachmentAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setShowAttachments(!showAttachments);
  };

  const handlePickImage = async () => {
    await pickImage();
    setShowAttachments(false);
  };

  const handlePickVideo = async () => {
    await pickVideo();
    setShowAttachments(false);
  };

  const handleTakePhoto = async () => {
    await takePhoto();
    setShowAttachments(false);
  };

  const attachmentRotation = attachmentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const attachmentMenuTranslateY = attachmentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const attachmentMenuOpacity = attachmentAnim;

  return (
    <View style={styles.wrapper}>
      {/* Attachment Menu */}
      <Animated.View
        style={[
          styles.attachmentMenu,
          {
            opacity: attachmentMenuOpacity,
            transform: [{ translateY: attachmentMenuTranslateY }],
          },
        ]}
        pointerEvents={showAttachments ? "auto" : "none"}
      >
        <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.secondary[500] }]}>
            <Ionicons name="image" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachmentOption} onPress={handleTakePhoto}>
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.primary[500] }]}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachmentOption} onPress={handlePickVideo}>
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.accent[500] }]}>
            <Ionicons name="videocam" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.attachmentOption}>
          <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.info }]}>
            <Ionicons name="mic" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Selected Media Preview */}
      {selectedMedia && (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <View style={[styles.uploadProgress, { width: `${uploadProgress}%` }]} />
            </View>
          )}
          <TouchableOpacity style={styles.removeMedia} onPress={clearMedia}>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <View style={styles.container}>
        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={toggleAttachments}
          disabled={disabled}
        >
          <Animated.View style={{ transform: [{ rotate: attachmentRotation }] }}>
            <Ionicons
              name="add"
              size={28}
              color={showAttachments ? theme.colors.primary[400] : theme.colors.text.secondary}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* Text Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message Jia..."
            placeholderTextColor={theme.colors.text.muted}
            value={messageInput}
            onChangeText={setMessageInput}
            multiline
            maxLength={2000}
            editable={!disabled}
          />
          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons name="happy-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Send/Voice Button */}
        {messageInput.trim() || selectedMedia ? (
          <TouchableOpacity
            style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.dark.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark.border,
  },
  attachmentMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.dark.tertiary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  attachmentOption: {
    alignItems: "center",
  },
  attachmentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  mediaPreview: {
    margin: 12,
    marginBottom: 0,
    position: "relative",
    alignSelf: "flex-start",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  uploadProgress: {
    height: 3,
    backgroundColor: theme.colors.primary[400],
  },
  removeMedia: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.dark.card,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.dark.tertiary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiButton: {
    paddingLeft: 8,
    paddingBottom: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.glow,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
