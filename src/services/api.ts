import AsyncStorage from '@react-native-async-storage/async-storage';

// Konstanta untuk kunci storage (sama dengan yang ada di LoginScreen)
const STORAGE_KEYS = {
  REMEMBER_ME: 'remember_me',
  USER_IDENTIFIER: 'user_identifier',
  USER_PASSWORD: 'user_password',
  AUTH_TOKEN: 'auth_token', // Untuk menyimpan token autentikasi
  CLIENT_ID: 'client_id',
};

// Definisi SessionManager untuk mengelola token
const SessionManager = {
  async clearToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      return true;
    } catch (error) {
      console.error('Error clearing token:', error);
      return false;
    }
  },

  async setToken(token: string) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
};

// Fungsi untuk memeriksa status login
export const checkLoginStatus = async (): Promise<boolean> => {
  try {
    const token = await SessionManager.getToken();
    return !!token; // Mengembalikan true jika token ada, false jika tidak
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// Fungsi untuk memeriksa apakah token sudah expired
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const token = await SessionManager.getToken();
    if (!token) { return true; } // Jika token tidak ada, anggap expired

    // Di sini biasanya ada logika untuk decode token JWT dan memeriksa waktu expiry
    // Untuk sementara, kita return false (token tidak expired)
    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Jika ada error, anggap token expired
  }
};

// Fungsi untuk login
export const loginUser = async (identifier: string, password: string) => {
  try {
    // Implementasi login sederhana
    const response = await fetch('https://portal.relabs.id/mobile/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.data?.token) {
      // Simpan token ke SessionManager
      await SessionManager.setToken(data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Tambahkan fungsi untuk logout yang juga membersihkan token yang disimpan
export const logoutUser = async () => {
  try {
    // Clear token dari SessionManager
    await SessionManager.clearToken();

    // Jika Remember Me tidak diaktifkan, hapus semua kredensi login
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    if (rememberMe !== 'true') {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_IDENTIFIER);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PASSWORD);
      await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }

    // Selalu hapus token autentikasi
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.CLIENT_ID);

    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};
