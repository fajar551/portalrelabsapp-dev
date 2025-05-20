import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

// Konfigurasi API
const CONFIG = {
  // URL backend Laravel
  API_URL: 'https://portal.relabs.id',

  // Nonaktifkan mode demo untuk menggunakan API sebenarnya
  USE_DEMO_MODE: true,

  // Timeout untuk fetch requests (ms)
  FETCH_TIMEOUT: 15000, // 15 detik
};

// Konstanta untuk kunci storage (sama dengan yang ada di LoginScreen)
const STORAGE_KEYS = {
  REMEMBER_ME: 'remember_me',
  USER_IDENTIFIER: 'user_identifier',
  USER_PASSWORD: 'user_password',
  AUTH_TOKEN: 'auth_token', // Untuk menyimpan token autentikasi
  CLIENT_ID: 'client_id',
  USER_TOKEN: 'userToken',
  TOKEN_EXPIRES_AT: 'tokenExpiresAt',
  USER_DATA: 'userData',
};

// Definisi SessionManager untuk mengelola token
const SessionManager = {
  async clearToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
      return true;
    } catch (error) {
      console.error('Error clearing token:', error);
      return false;
    }
  },

  async setToken(token: string) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      return false;
    }
  },

  async getToken() {
    try {
      // Prioritaskan USER_TOKEN untuk kompatibilitas dengan api.js
      const userToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
      if (userToken) { return userToken; }

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

// Fungsi untuk memeriksa apakah token sudah kedaluwarsa
export const isTokenExpired = async (): Promise<boolean> => {
  try {
    const token = await SessionManager.getToken();
    if (!token) { return true; } // Jika token tidak ada, anggap expired

    // Periksa expiresAt seperti pada api.js
    const expiresAtString = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAtString) {
      return true; // Jika tidak ada expires_at, anggap sudah expired
    }

    const expiresAt = new Date(expiresAtString);
    const now = new Date();

    return now >= expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Jika ada error, anggap token expired
  }
};

// Fungsi untuk login
export const loginUser = async (identifier: string, password: string, device_name: string = 'mobile_app') => {
  try {
    console.log('Login dengan API Laravel:', `${CONFIG.API_URL}/mobile/login`);

    // Implementasi login sederhana
    const response = await fetch(`${CONFIG.API_URL}/mobile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
        device_name,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal melakukan login');
    }

    // Jika login berhasil, simpan token dan expires_at di AsyncStorage
    if (data.status === 'success' && data.data?.token) {
      // Simpan token ke SessionManager
      await SessionManager.setToken(data.data.token);

      // Simpan waktu kedaluwarsa token seperti pada api.js
      if (data.data?.expires_at) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, data.data.expires_at);
      }

      // Simpan juga data client
      if (data.data?.client) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.data.client));
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Tambahkan fungsi untuk logout yang juga membersihkan token yang disimpan
export const logoutUser = async (): Promise<boolean> => {
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

    // Hapus token dan data user seperti pada api.js
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.CLIENT_ID,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
    ]);

    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Ambil semua data client
export const getAllClients = async () => {
  try {
    console.log('Mengambil data dari API: https://portal.relabs.id/mobile/all-clients');

    const response = await fetch(`${CONFIG.API_URL}/mobile/all-clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Response error dengan status: ${response.status}`);
    }

    const data = await response.json();

    if (data?.data?.clients) {
      console.log('Berhasil mengambil data clients dari API!');
      return data.data.clients;
    } else {
      throw new Error('Format data tidak sesuai yang diharapkan');
    }

  } catch (err: any) {
    console.error('Error pada getAllClients:', err.message);
    throw err;
  }
};

// Ambil semua notifikasi (dengan token)
export const getNotifications = async (userId?: number) => {
  try {
    const token = await SessionManager.getToken();
    if (!token) { throw new Error('Token tidak ditemukan'); }

    let url = `${CONFIG.API_URL}/mobile/notifications`;
    if (userId) {
      url += `?userid=${userId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Response error dengan status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.data?.notifications) {
      return data.data.notifications;
    } else {
      throw new Error('Format data tidak sesuai yang diharapkan');
    }
  } catch (error) {
    console.error('Gagal mengambil notifikasi:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan profil client
export const getClientProfile = async () => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token (gunakan path mobile/client seperti di api.js jika diperlukan)
    const response = await fetch(`${CONFIG.API_URL}/mobile/client`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil data profil');
    }

    return data.data.client;
  } catch (error) {
    console.error('Error saat mengambil profil client:', error);
    throw error;
  }
};

// Ambil semua invoice untuk client yang login
export const getClientInvoices = async () => {
  try {
    // Gunakan SessionManager.getToken() untuk konsistensi
    const token = await SessionManager.getToken();

    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/invoices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil data invoice');
    }

    return data.data.invoices;
  } catch (error) {
    console.error('Error saat mengambil invoice client:', error);
    throw error;
  }
};

// Ambil detail invoice berdasarkan ID
export const getInvoiceById = async (invoiceId: any) => {
  try {
    // Gunakan SessionManager.getToken() untuk konsistensi
    const token = await SessionManager.getToken();

    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil detail invoice');
    }

    // Jika API mengembalikan informasi pembayaran
    if (data.data.payment_info) {
      // Pastikan informasi VA tersedia untuk tampilan
      data.data.payment_info = {
        ...data.data.payment_info,
        // Extract VA number jika tersedia di payment_info
        va_number: data.data.payment_info.va_number ||
          data.data.payment_info.account_number ||
          data.data.payment_info.virtual_account_number || '',
      };
    }

    return data.data;
  } catch (error) {
    console.error('Error saat mengambil detail invoice:', error);
    throw error;
  }
};

// Ambil detail invoice lengkap beserta hosting dan produk terkait
export const getDetailedClientInvoices = async () => {
  try {
    // Gunakan SessionManager.getToken() untuk konsistensi
    const token = await SessionManager.getToken();

    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/invoice-details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil detail invoice');
    }

    return data.data;
  } catch (error) {
    console.error('Error saat mengambil detail invoice:', error);
    throw error;
  }
};

// Ambil history pembayaran
export const getPaymentHistory = async () => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/payment-history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil riwayat pembayaran');
    }

    return data.data.payments;
  } catch (error) {
    console.error('Error saat mengambil riwayat pembayaran:', error);
    throw error;
  }
};

// Ambil data payment gateways
export const getPaymentGateways = async () => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/payment-gateways`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil daftar payment gateway');
    }

    return data.data.gateways;
  } catch (error) {
    console.error('Error saat mengambil payment gateways:', error);
    throw error;
  }
};

// Fungsi untuk generate virtual account number
export const generateVirtualAccount = async (invoiceId: string, gatewayId: number) => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API untuk generate VA number
    const response = await fetch(`${CONFIG.API_URL}/mobile/generate-va`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        invoice_id: invoiceId,
        gateway_id: gatewayId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal menghasilkan nomor virtual account');
    }

    return data.data;
  } catch (error) {
    console.error('Error saat generate virtual account:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan detail invoice
export const getInvoiceDetails = async (invoiceId: any) => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
    const response = await fetch(`${CONFIG.API_URL}/mobile/invoice-details/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil detail invoice');
    }

    // Return data detail invoice termasuk items, charges, taxes, dll
    return {
      ...data.data.invoice,
      details: data.data.details || [],
      charges: data.data.charges || [],
      taxes: data.data.taxes || [],
      monthly_charges: data.data.monthly_charges || [],
      prorated_charges: data.data.prorated_charges || [],
    };
  } catch (error) {
    console.error('Error saat mengambil detail invoice:', error);
    throw error;
  }
};

export const getFCMToken = async (userId: number) => {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Ambil token dari SessionManager
    const authToken = await SessionManager.getToken();

    if (!authToken) {
      console.error('No auth token found');
      return null;
    }

    // Kirim token ke backend
    const response = await fetch(
      `${CONFIG.API_URL}/mobile/save-fcm-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_id: userId,
          fcm_token: token,
        }),
      },
    );

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to save FCM token');
    }

    console.log('Save FCM Token result:', result);
    return token;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return null;
  }
};
