import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config';

const TOKEN_KEY = 'esnaaf_provider_token';

export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const customFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAuthToken();
  const baseUrl = getApiUrl();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });
};
