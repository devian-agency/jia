import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Device from "expo-device";
import { theme } from "../theme";
import { ChatHeader } from "../components/chat/ChatHeader";
import { MessageBubble } from "../components/chat/MessageBubble";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { MessageInput } from "../components/chat/MessageInput";
import { ProfileSheet } from "../components/profile/ProfileSheet";
import { TokenInfoSheet } from "../components/profile/TokenInfoSheet";
import {
  useInitializeUser,
  useGetOrCreateConversation,
  useMessages,
  useSendMessage,
  useAddReaction,
  useDailyCheckIn,
} from "../hooks/useConvex";
import { useUserStore, useChatStore, useUIStore } from "../stores";

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const { userId, deviceId, isInitialized, setDeviceId } = useUserStore();
  const { isJiaTyping } = useChatStore();
  const { isProfileSheetOpen, setProfileSheetOpen } = useUIStore();
  const [showTokenSheet, setShowTokenSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { initialize } = useInitializeUser();
  const getOrCreateConversation = useGetOrCreateConversation();
  const messages = useMessages();
  const sendMessage = useSendMessage();
  const addReaction = useAddReaction();
  const checkIn = useDailyCheckIn();

  // Initialize user and conversation
  useEffect(() => {
    async function init() {
      try {
        // Generate or get device ID
        const savedDeviceId = deviceId || Device.osInternalBuildId || `device_${Date.now()}`;
        if (!deviceId) {
          setDeviceId(savedDeviceId);
        }

        // Initialize user
        await initialize(savedDeviceId);

        // Get or create conversation
        await getOrCreateConversation();

        // Perform daily check-in
        const checkinResult = await checkIn();
        if (checkinResult?.success && (checkinResult.bonusTokens ?? 0) > 0) {
          console.log(`Daily check-in: +${checkinResult.bonusTokens} tokens!`);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        setIsLoading(false);
      }
    }

    if (!isInitialized) {
      init();
    } else {
      setIsLoading(false);
    }
  }, [isInitialized, deviceId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isJiaTyping]);

  const handleSendMessage = async (text: string) => {
    console.log("handleSendMessage called with:", text);
    try {
      await sendMessage(text);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId as any, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  if (isLoading || !userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ImageBackground
        source={require("../assets/background.jpg")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        {/* Header */}
        <ChatHeader onMenuPress={() => setShowTokenSheet(true)} />

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MessageBubble
              id={item._id}
              content={item.content}
              role={item.role}
              createdAt={item.createdAt}
              contentType={item.contentType}
              media={item.media}
              reactions={item.reactions}
              onReact={(emoji: string) => handleReaction(item._id, emoji)}
            />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isJiaTyping ? <TypingIndicator /> : null}
        />

        {/* Message Input */}
        <MessageInput onSend={handleSendMessage} disabled={isJiaTyping || !userId} />

        {/* Profile Sheet */}
        <ProfileSheet
          visible={isProfileSheetOpen}
          onClose={() => setProfileSheetOpen(false)}
        />

        {/* Token Info Sheet */}
        <TokenInfoSheet visible={showTokenSheet} onClose={() => setShowTokenSheet(false)} />

        <StatusBar style="light" backgroundColor={theme.colors.dark.secondary} />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.05,
  },
  messagesList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
});
