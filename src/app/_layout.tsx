import "../global.css";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { ConvexClientProvider } from "../providers/ConvexProvider";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    instrument: require("../fonts/instrument.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ConvexClientProvider>
      <SafeAreaView style={styles.container}>
        <Slot />
      </SafeAreaView>
    </ConvexClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
});