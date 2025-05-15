import CheckBox from '@react-native-community/checkbox';
// import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  // Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {loginUser} from '../../src/services/api';
import ClientDropdown from '../components/ClientDropdown';
// import { useNavigation } from '@react-navigation/native';

// Konstanta untuk kunci storage
const STORAGE_KEYS = {
  REMEMBER_ME: 'remember_me',
  USER_IDENTIFIER: 'user_identifier',
  USER_PASSWORD: 'user_password',
};

interface LoginScreenProps {
  onLoginSuccess: () => void;
  navigateToScreen: (screen: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  navigateToScreen,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); // State untuk popup
  const [showPassword, setShowPassword] = useState(false); // State untuk menampilkan/menyembunyikan password

  // Memeriksa dan mengambil data yang tersimpan saat komponen dimuat
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const rememberedStatus = await AsyncStorage.getItem(
          STORAGE_KEYS.REMEMBER_ME,
        );

        if (rememberedStatus === 'true') {
          const savedIdentifier = await AsyncStorage.getItem(
            STORAGE_KEYS.USER_IDENTIFIER,
          );
          const savedPassword = await AsyncStorage.getItem(
            STORAGE_KEYS.USER_PASSWORD,
          );

          if (savedIdentifier && savedPassword) {
            setIdentifier(savedIdentifier);
            setPassword(savedPassword);
            setRemember(true);

            // Opsional: Login otomatis
            // await handleLogin(savedIdentifier, savedPassword);
          }
        }
      } catch (err) {
        console.error('Error loading saved credentials:', err);
      }
    };

    loadSavedCredentials();
  }, []);

  // Menyimpan atau menghapus kredensial berdasarkan status "Remember Me"
  const saveCredentials = async (
    userIdentifier: string,
    userPassword: string,
    shouldRemember: boolean,
  ) => {
    try {
      if (shouldRemember) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_IDENTIFIER,
          userIdentifier,
        );
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PASSWORD, userPassword);
      } else {
        // Hapus kredensial yang tersimpan jika "Remember Me" tidak dicentang
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_IDENTIFIER);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_PASSWORD);
      }
    } catch (err) {
      console.error('Error saving credentials:', err);
    }
  };

  const handleLogin = async () => {
    // Validasi form dasar
    if (!identifier.trim() || !password.trim()) {
      setError('Email/ID Pelanggan dan password harus diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Login ke API
      const response = await loginUser(identifier, password);
      setIsLoading(false);

      if (response && response.status === 'success') {
        console.log('Login berhasil:', response.data.client.name);

        // Simpan kredensial jika "Remember Me" dicentang
        await saveCredentials(identifier, password, remember);

        onLoginSuccess();
      } else {
        setError(response.message || 'Terjadi kesalahan saat login');
      }
    } catch (err) {
      // Mengubah nama variabel dari 'error' menjadi 'err'
      setIsLoading(false);
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat login',
      );
    }
  };

  // const _handleResetPassword = async () => {
  //   if (!identifier || !identifier.trim()) {
  //     Alert.alert('Error', 'Masukkan email yang valid');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError('');

  //   try {
  //     // Ganti dengan URL API Anda
  //     const response = await axios.post(
  //       'https://portal.relabs.id/mobile/forgot-password',
  //       {
  //         email: identifier,
  //       },
  //     );

  //     if (response.data.status === 'success') {
  //       setError(response.data.message);
  //       setTimeout(() => {
  //         navigateToScreen('Login');
  //       }, 3000);
  //     }
  //   } catch (err: any) {
  //     let errorMessage =
  //       'Terjadi kesalahan saat mengirim permintaan reset password.';

  //     if (err.response) {
  //       if (err.response.status === 404) {
  //         errorMessage = 'Email tidak ditemukan dalam database.';
  //       } else if (err.response.data && err.response.data.message) {
  //         errorMessage = err.response.data.message;
  //       }
  //     }

  //     Alert.alert('Error', errorMessage);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}>
      <ScrollView
        contentContainerStyle={styles.containerFlex1}
        keyboardShouldPersistTaps="handled">
        <View style={styles.root}>
          <View style={styles.card}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Login Member Area</Text>
            <Text style={styles.subtitle}>
              Please insert your Email or Customer ID and Password to Login
            </Text>

            <Text style={styles.label}>Email / ID Pelanggan</Text>
            <TextInput
              style={styles.input}
              placeholder="Email or Customer ID"
              placeholderTextColor="#b0c4de"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="default"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#b0c4de"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}>
                <Text style={styles.eyeText}>
                  {showPassword ? 'Tutup' : 'Lihat'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigateToScreen('ForgotPassword')}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.rememberRow}>
              <CheckBox
                value={remember}
                onValueChange={setRemember}
                style={styles.checkbox}
                tintColors={{true: '#fd7e14', false: '#888888'}}
                boxType="square"
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Client Dropdown untuk Testing */}
            <View style={styles.testingSection}>
              <Text style={styles.testingSectionTitle}>
                Test API Connection
              </Text>
              <ClientDropdown />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Popup untuk Forgot Password */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Informasi</Text>
            <Text style={styles.modalMessage}>
              Aplikasi masih dalam tahap pengembangan. Fitur reset password
              belum tersedia.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowForgotPasswordModal(false)}>
              <Text style={styles.modalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerFlex1: {
    flexGrow: 1,
  },
  flex1: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8a98b7',
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    color: '#22325a',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    fontSize: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#eaf2ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    marginBottom: 6,
    color: '#22325a',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf2ff',
    borderRadius: 8,
    marginBottom: 6,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: '#22325a',
  },
  eyeButton: {
    padding: 10,
  },
  eyeText: {
    color: '#ffb444',
    fontSize: 14,
    fontWeight: '500',
  },
  forgot: {
    color: '#b0c4de',
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: 2,
    fontSize: 13,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    marginTop: 2,
  },
  checkbox: {
    marginRight: 8,
    width: 20,
    height: 20,
    borderWidth: 1,
  },
  rememberText: {
    color: '#22325a',
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: '#ffb444',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    marginTop: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  signupText: {
    color: '#3b82f6',
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
  },
  testingSection: {
    marginTop: 20,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  testingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Styles untuk Modal Popup
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#ffb84d',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;
