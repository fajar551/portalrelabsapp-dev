import axios from 'axios';
import React, {useState} from 'react';
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

interface ForgotPasswordScreenProps {
  navigateToScreen: (screen: string, params?: any) => void;
  route?: {params: {email?: string; token?: string}};
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigateToScreen,
  // route,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !email.trim()) {
      Alert.alert('Error', 'Masukkan email yang valid');
      return;
    }

    setIsLoading(true);

    try {
      // Kirim request forgot password
      const response = await axios.post(
        'https://portal.relabs.id/mobile/forgot-password',
        {
          email: email,
        },
      );

      setIsLoading(false);

      if (response.data.success === true) {
        // Tampilkan konfirmasi sukses, bukan error
        Alert.alert('Sukses', 'Kode verifikasi telah dikirim ke email Anda', [
          {
            text: 'OK',
            onPress: () => {
              // Navigasi ke VerifyCodeScreen setelah menekan OK
              navigateToScreen('VerifyCode', {email: email});
            },
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          response.data.message || 'Gagal mengirim kode verifikasi',
        );
      }
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage =
        'Terjadi kesalahan saat mengirim permintaan reset password.';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Email tidak ditemukan dalam database.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

      Alert.alert('Error', errorMessage);
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
            <Text style={styles.title}>Mengubah Password</Text>
            <Text style={styles.subtitle}>
              Silakan masukkan email Anda untuk menerima instruksi untuk
              mereset password.
            </Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email Anda"
              placeholderTextColor="#b0c4de"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.orText}>or</Text>

            <TouchableOpacity onPress={() => navigateToScreen('Login')}>
              <Text style={styles.backToLoginText}>Back to Login</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8a98b7',
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#aedbc7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  successMessage: {
    flex: 1,
    color: '#2f7c5c',
    fontSize: 14,
  },
  closeButton: {
    color: '#2f7c5c',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    alignSelf: 'flex-start',
    color: '#22325a',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#eaf2ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    marginBottom: 20,
    color: '#22325a',
  },
  resetButton: {
    backgroundColor: '#ffb444',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orText: {
    color: '#8a98b7',
    marginVertical: 10,
    fontSize: 14,
  },
  backToLoginText: {
    color: '#ffb444',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
