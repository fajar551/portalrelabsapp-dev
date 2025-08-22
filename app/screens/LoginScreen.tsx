import CheckBox from '@react-native-community/checkbox';
// import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getFCMToken, loginUser} from '../../src/services/api';
// import ClientDropdown from '../components/ClientDropdown';
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
  onWhatsAppLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  navigateToScreen,
  onWhatsAppLogin,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          }
        }
      } catch (err) {
        console.error('Error loading saved credentials:', err);
      }
    };

    loadSavedCredentials();
  }, []);

  useEffect(() => {
    // Animate version text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_IDENTIFIER);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_PASSWORD);
      }
    } catch (err) {
      console.error('Error saving credentials:', err);
    }
  };

  const handleLoginSuccess = async (_userData: any) => {
    try {
      const fcmToken = await getFCMToken();
      if (!fcmToken) {
        console.error('Failed to setup push notification');
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error('Error in handleLoginSuccess:', err);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Email/ID Pelanggan dan password harus diisi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser(identifier, password);

      if (response && response.status === 'success') {
        console.log('Login berhasil:', response.data.client.name);
        await saveCredentials(identifier, password, remember);
        await handleLoginSuccess(response.data.client);
      } else {
        setError(response.message || 'Terjadi kesalahan saat login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat login',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppLogin = () => {
    onWhatsAppLogin();
  };

  return (
    <LinearGradient
      colors={[
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
      ]}
      style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}>
        <ScrollView
          contentContainerStyle={styles.containerFlex1}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}>
          <View style={styles.root}>
            <View style={styles.card}>
              {/* Logo Qwords */}
              <Image
                source={{
                  uri: 'https://portal.internetan.id/mobile/img/qwords.png',
                }}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>Masukkan Akun Relabs</Text>
              <Text style={styles.subtitle}>
                Silakan masukkan Email/ID Pelanggan dan Password untuk Masuk
              </Text>

              <Text style={styles.label}>Email/ID Pelanggan</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan Email/ID Pelanggan"
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
                  placeholder="Masukkan Password"
                  placeholderTextColor="#b0c4de"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}>
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="rgba(246, 138, 9, 1)"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigateToScreen('ForgotPassword')}
                style={styles.forgotContainer}>
                <Text style={styles.forgot}>Lupa Password?</Text>
              </TouchableOpacity>

              <View style={styles.rememberRow}>
                <CheckBox
                  value={remember}
                  onValueChange={setRemember}
                  style={styles.checkbox}
                  tintColors={{
                    true: 'rgba(246, 138, 9, 1)',
                    false: 'rgba(246, 138, 9, 1)',
                  }}
                  boxType="square"
                />
                <Text style={styles.rememberText}>Ingat Saya</Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}>
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Or</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* WhatsApp Login Button */}
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleWhatsAppLogin}>
                <Image
                  source={{
                    uri: 'https://portal.internetan.id/mobile/img/whatsapp.png',
                  }}
                  style={styles.whatsappIcon}
                  resizeMode="contain"
                />
                <Text style={styles.whatsappButtonText}>
                  Masuk dengan WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Information */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                PT Relabs Net DayaCipta © {new Date().getFullYear()},{'\n'}
                Relabs adalah anggota dari{'\n'}
                PT Qwords Company International Group
              </Text>
              <Animated.Text
                style={[
                  styles.versionText,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                Versi 1.4
              </Animated.Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  flex1: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    minHeight: '100%',
  },
  containerFlex1: {
    flexGrow: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 111,
    height: 111,
    marginTop: -15,
    marginBottom: -10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 18,
  },
  label: {
    alignSelf: 'flex-start',
    color: 'rgba(0, 0, 0, 1)',
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    width: '100%',
    maxWidth: 318,
    height: 40,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 15,
    color: '#000',
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(246, 138, 9, 1)',
  },
  passwordContainer: {
    width: '100%',
    maxWidth: 318,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginBottom: 15,
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(246, 138, 9, 1)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
  },
  eyeButton: {
    padding: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgot: {
    color: 'rgba(207, 116, 7, 1)',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 6,
    width: 16,
    height: 16,
    borderWidth: 1,
  },
  rememberText: {
    color: '#000',
    fontSize: 14,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#rgba(246, 138, 9, 1)',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    height: 40,
    width: '100%',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loginButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  separator: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#e0e0e0',
  },
  separatorText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 13,
  },
  whatsappButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 3,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: 'rgba(246, 138, 9, 1)',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  whatsappIcon: {
    width: 31,
    height: 31,
    marginRight: 8,
  },
  whatsappButtonText: {
    color: 'rgba(246, 138, 9, 1)',
    fontWeight: '500',
    fontSize: 15,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
    fontWeight: '400',
  },
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
  versionText: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '400',
  },
});

export default LoginScreen;
