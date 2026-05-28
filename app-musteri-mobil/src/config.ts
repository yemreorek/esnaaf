import { Platform } from 'react-native';

export const DEV_MACHINE_IP = '192.168.1.12'; 

export const getApiUrl = () => {
  if (__DEV__) {
    // Hem emülatör hem de fiziksel cihazlar için yerel makine IP'sini kullanmak en güvenlisidir.
    return `http://${DEV_MACHINE_IP}:3000`;
  }
  return 'https://api.esnaaf.com'; // Üretim ortamı
};

export const getSocketUrl = () => {
  if (__DEV__) {
    return `http://${DEV_MACHINE_IP}:3005`;
  }
  return 'https://socket.esnaaf.com';
};
