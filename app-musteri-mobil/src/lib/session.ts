import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

const SESSION_KEY = 'esnaaf_session_id';

let activeSessionId: string | null = null;

// Polyfill-free, pure JS self-contained UUIDv4 generator
export const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const startNewSession = async (): Promise<string> => {
  const freshId = generateUUIDv4();
  activeSessionId = freshId;
  try {
    await AsyncStorage.setItem(SESSION_KEY, freshId);
  } catch (err) {
    console.error('Failed to save fresh session ID to AsyncStorage:', err);
  }
  return freshId;
};

export const getOrCreateSessionId = async (): Promise<string> => {
  if (activeSessionId) {
    return activeSessionId;
  }
  try {
    let sessionId = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateUUIDv4();
      await AsyncStorage.setItem(SESSION_KEY, sessionId);
    }
    activeSessionId = sessionId;
    return sessionId;
  } catch (err) {
    console.error('Session ID retrieval failed, using temporary ID:', err);
    const tempId = generateUUIDv4();
    activeSessionId = tempId;
    return tempId;
  }
};

export const customFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const sessionId = await getOrCreateSessionId();
  const baseUrl = getApiUrl();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
    ...(options.headers || {}),
  };

  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });
};
