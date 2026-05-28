import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getOrCreateSessionId } from '../src/lib/session';

export default function RootLayout() {
  // Application startup session initialization
  useEffect(() => {
    const initSession = async () => {
      try {
        const sid = await getOrCreateSessionId();
        console.log(`[Esnaaf Mobile Seeker] Anonymous Session ID initialized: ${sid}`);
      } catch (err) {
        console.error('Session initialization error:', err);
      }
    };
    initSession();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="chat" />
      </Stack>
    </SafeAreaProvider>
  );
}
