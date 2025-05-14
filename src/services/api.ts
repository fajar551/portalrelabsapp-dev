import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Fungsi untuk mendapatkan profil client
export const getClientProfile = async () => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    const response = await fetch('https://portal.relabs.id/mobile/client/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === 'success' && data.data?.client) {
      return data.data.client;
    } else {
      throw new Error(data.message || 'Gagal memuat data profil');
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Ambil semua invoice untuk client yang login
export const getClientInvoices = async () => {
  try {
    // Ambil token dari AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

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
    // Ambil token dari AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

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

    return data.data;
  } catch (error) {
    console.error('Error saat mengambil detail invoice:', error);
    throw error;
  }
};

// Ambil detail invoice lengkap beserta hosting dan produk terkait
export const getDetailedClientInvoices = async () => {
  try {
    // Ambil token dari AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

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


// Fungsi untuk mendapatkan data periode pembayaran
export const getBillingPeriod = async () => {
  try {
    const token = await SessionManager.getToken();
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }

    const response = await fetch('https://portal.relabs.id/mobile/billing/period', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === 'success' && data.data) {
      return {
        startDate: data.data.startDate || new Date(),
        dueDate: data.data.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        amount: data.data.amount || 234765,
      };
    } else {
      // Jika gagal, gunakan periode default
      return {
        startDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        amount: 234765,
      };
    }
  } catch (error) {
    console.error('Error fetching billing period:', error);
    // Fallback ke nilai default jika terjadi kesalahan
    return {
      startDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      amount: 234765,
    };
  }
};
