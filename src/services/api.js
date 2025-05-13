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

  } catch (error) {
    console.error('Error pada getAllClients:', error.message);
    throw error;
  }
};

// Login user dengan endpoint Laravel
export const loginUser = async (identifier, password) => {
  try {
    console.log('Login dengan API Laravel:', `${CONFIG.API_URL}/mobile/login`);

    const response = await fetch(`${CONFIG.API_URL}/mobile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier,
        password,
        device_name: 'mobile_app',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal melakukan login');
    }

    // Jika login berhasil, simpan token dan expires_at di AsyncStorage
    if (data.status === 'success' && data.data?.token) {
      await AsyncStorage.setItem('userToken', data.data.token);

      // Simpan waktu kedaluwarsa token
      if (data.data?.expires_at) {
        await AsyncStorage.setItem('tokenExpiresAt', data.data.expires_at);
      }

      // Simpan juga data client
      if (data.data?.client) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.client));
      }
    }

    return data;
  } catch (error) {
    console.error('Error pada loginUser:', error.message);
    throw error;
  }
};

// Periksa status login dengan memeriksa token di AsyncStorage
export const checkLoginStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    // Jika token ada, lakukan validasi token (opsional)
    if (token) {
      // Untuk verifikasi sederhana, cukup periksa keberadaan token
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// Logout user dengan menghapus token dari AsyncStorage
export const logoutUser = async () => {
  try {
    // Hapus token dan data user
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Ambil profil client berdasarkan token yang tersimpan
export const getClientProfile = async () => {
  try {
    // Ambil token dari AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login kembali.');
    }

    // Request ke API dengan token
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

// Fungsi untuk memeriksa apakah token sudah kedaluwarsa
export const isTokenExpired = async () => {
  try {
    const expiresAtString = await AsyncStorage.getItem('tokenExpiresAt');

    if (!expiresAtString) {
      return true; // Jika tidak ada expires_at, anggap sudah expired
    }

    const expiresAt = new Date(expiresAtString);
    const now = new Date();

    return now >= expiresAt;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Jika terjadi error, anggap expired untuk keamanan
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
export const getInvoiceById = async (invoiceId) => {
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
