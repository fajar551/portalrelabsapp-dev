import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface VerifyCodeScreenProps {
  navigateToScreen: (screen: string) => void;
  onLoginSuccess?: () => void;
  route: {params: {email: string}};
}

const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({
  navigateToScreen,
  onLoginSuccess: _onLoginSuccess,
  route,
}) => {
  const {email} = route.params;
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length <= 1) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Auto focus to next input
      if (text.length === 1 && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    // Validasi input
    const verificationCode = code.join('');
    if (verificationCode.length !== 4) {
      Alert.alert(
        'Error',
        'Harap masukkan kode 4 digit yang dikirim ke email Anda',
      );
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Harap masukkan password baru');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Password baru dan konfirmasi password tidak sama');
      return;
    }

    // Password minimum 6 karakter
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal harus 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      // Kirim permintaan reset password ke API
      const response = await axios.post(
        'https://portal.relabs.id/mobile/reset-password',
        {
          email,
          token: verificationCode,
          password: newPassword,
          password_confirmation: confirmPassword,
        },
      );

      if (response.data.success === true) {
        // Reset password berhasil, sekarang lakukan login otomatis
        try {
          // Panggil API login dengan email dan password baru
          const loginResponse = await axios.post(
            'https://portal.relabs.id/mobile/login',
            {
              identifier: email,
              password: newPassword,
              device_name: 'mobile_app',
            },
          );

          if (loginResponse.data.status === 'success') {
            // Simpan token ke AsyncStorage
            await AsyncStorage.setItem(
              'userToken',
              loginResponse.data.data.token,
            );

            // Simpan data user
            await AsyncStorage.setItem(
              'userData',
              JSON.stringify(loginResponse.data.data.client),
            );

            // Tampilkan popup sukses
            Alert.alert('Sukses', 'Password berhasil diperbarui', [
              {
                text: 'OK',
                onPress: () => {
                  // Panggil onLoginSuccess untuk navigasi ke HomeScreen
                  if (_onLoginSuccess) {
                    _onLoginSuccess();
                  } else {
                    // Fallback ke login screen jika onLoginSuccess tidak tersedia
                    navigateToScreen('Login');
                  }
                },
              },
            ]);
          } else {
            // Login gagal, arahkan ke halaman login
            Alert.alert(
              'Sukses',
              'Password berhasil diperbarui. Silakan login dengan password baru Anda.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    navigateToScreen('Login');
                  },
                },
              ],
            );
          }
        } catch (loginError) {
          // Jika login gagal, tetap tampilkan pesan sukses reset password
          Alert.alert(
            'Sukses',
            'Password berhasil diperbarui. Silakan login dengan password baru Anda.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigateToScreen('Login');
                },
              },
            ],
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        Alert.alert('Error', response.data.message || 'Gagal mereset password');
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat mereset password';

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    try {
      // Kirim ulang permintaan kode
      const response = await axios.post(
        'https://portal.relabs.id/mobile/forgot-password',
        {
          email,
        },
      );

      if (response.data.success === true) {
        Alert.alert(
          'Sukses',
          'Kode verifikasi baru telah dikirim ke email Anda',
        );
      } else {
        Alert.alert(
          'Error',
          response.data.message || 'Gagal mengirim ulang kode',
        );
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat mengirim ulang kode';

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex1}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.card}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Masukkan kode 4 digit yang dikirim ke email {email}
            </Text>

            {/* Kode Verifikasi 4 Digit */}
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3].map(index => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.codeInput}
                  value={code[index]}
                  onChangeText={text => handleCodeChange(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleResendCode}>
              <View style={styles.resendContainer}>
                <Text style={styles.resendText1}>Tidak menerima email? </Text>
                <Text style={styles.resendText2}>Kirim Ulang</Text>
              </View>
            </TouchableOpacity>

            {/* Password Baru */}
            <Text style={styles.label}>Password Baru</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="#b0c4de"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}>
                <Text style={styles.eyeText}>
                  {showPassword ? 'Tutup' : 'Lihat'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Konfirmasi Password Baru */}
            <Text style={styles.label}>Konfirmasi Password Baru</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#b0c4de"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}>
                <Text style={styles.eyeText}>
                  {showConfirmPassword ? 'Tutup' : 'Lihat'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a0aec0',
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: '#a0aec0',
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
  },
  resendContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  resendText1: {
    color: '#a0aec0',
    fontSize: 14,
  },
  resendText2: {
    color: '#ffb444',
    fontSize: 14,
  },
  label: {
    alignSelf: 'flex-start',
    color: '#22325a',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf2ff',
    borderRadius: 10,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: '#000',
  },
  eyeButton: {
    padding: 10,
  },
  eyeText: {
    color: '#ffb444',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#ffb444',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default VerifyCodeScreen;
