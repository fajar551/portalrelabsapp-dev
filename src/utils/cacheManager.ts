import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys untuk AsyncStorage
export const CACHE_KEYS = {
  USER_DATA: 'userData',
  INVOICE_DATA: 'invoiceData',
  DOMAIN_STATUS: 'domainStatus',
  PAYMENT_HISTORY: 'paymentHistory',
  CACHE_TIMESTAMP: 'cacheTimestamp',
  LAST_LOGIN: 'lastLogin',
};

// Cache duration dalam milidetik (5 menit)
const CACHE_DURATION = 5 * 60 * 1000;

// Fungsi untuk mengecek apakah cache masih valid
export const isCacheValid = async (): Promise<boolean> => {
  try {
    const cacheTimestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    const lastLogin = await AsyncStorage.getItem(CACHE_KEYS.LAST_LOGIN);
    
    if (!cacheTimestamp || !lastLogin) {
      return false;
    }

    const currentTime = Date.now();
    const cacheTime = parseInt(cacheTimestamp);
    const loginTime = parseInt(lastLogin);

    // Cache valid jika:
    // 1. Cache dibuat dalam 5 menit terakhir
    // 2. Login time sama dengan atau lebih baru dari cache time
    return (currentTime - cacheTime) < CACHE_DURATION && loginTime >= cacheTime;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};

// Fungsi untuk menyimpan data ke cache
export const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
};

// Fungsi untuk mengambil data dari cache
export const getFromCache = async (key: string): Promise<any> => {
  try {
    const cachedData = await AsyncStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Error getting from cache (${key}):`, error);
    return null;
  }
};

// Fungsi untuk update cache timestamp
export const updateCacheTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error updating cache timestamp:', error);
  }
};

// Fungsi untuk menyimpan timestamp login
export const setLoginTimestamp = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_LOGIN, Date.now().toString());
  } catch (error) {
    console.error('Error setting login timestamp:', error);
  }
};

// Fungsi untuk membersihkan cache
export const clearCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.USER_DATA,
      CACHE_KEYS.INVOICE_DATA,
      CACHE_KEYS.DOMAIN_STATUS,
      CACHE_KEYS.PAYMENT_HISTORY,
      CACHE_KEYS.CACHE_TIMESTAMP,
      CACHE_KEYS.LAST_LOGIN,
    ]);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}; 