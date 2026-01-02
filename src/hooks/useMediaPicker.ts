import * as ImagePicker from "expo-image-picker";
import { useMediaStore } from "../stores";
import { useCallback } from "react";

export function useMediaPicker() {
  const { setSelectedMedia, setIsUploading, setUploadProgress } =
    useMediaStore();

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access media library is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "image" as const,
        mimeType: asset.mimeType || "image/jpeg",
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
        fileSize: asset.fileSize || 0,
      };
      setSelectedMedia(media);
      return media;
    }
    return null;
  }, [setSelectedMedia]);

  const pickVideo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access media library is required!");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "video" as const,
        mimeType: asset.mimeType || "video/mp4",
        fileName: asset.fileName || `video_${Date.now()}.mp4`,
        fileSize: asset.fileSize || 0,
      };
      setSelectedMedia(media);
      return media;
    }
    return null;
  }, [setSelectedMedia]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Permission to access camera is required!");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const media = {
        uri: asset.uri,
        type: "image" as const,
        mimeType: asset.mimeType || "image/jpeg",
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        fileSize: asset.fileSize || 0,
      };
      setSelectedMedia(media);
      return media;
    }
    return null;
  }, [setSelectedMedia]);

  return {
    pickImage,
    pickVideo,
    takePhoto,
    setIsUploading,
    setUploadProgress,
  };
}
