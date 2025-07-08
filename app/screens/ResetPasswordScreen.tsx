import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
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

interface ResetPasswordScreenProps {
  navigateToScreen: (screen: string) => void;
  route?: {params: {email?: string; token?: string}};
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  route = {params: {}},
  navigateToScreen,
}) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Ambil parameter dari deep link
    if (route && route.params) {
      setEmail(route.params.email || '');
      setToken(route.params.token || '');
    }
  }, [route]);

  const handleSubmit = async () => {
    // Validasi
    if (!email || !token || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    try {
      // Ganti dengan URL API Anda
      const response = await axios.post(
        'https://portal.relabs.id/mobile/reset-password',
        {
          email,
          token,
          password,
          password_confirmation: confirmPassword,
        },
      );

      if (response.data.status === 'success') {
        Alert.alert('Sukses', response.data.message, [
          {
            text: 'OK',
            onPress: () => navigateToScreen('Login'),
          },
        ]);
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat reset password.';

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Please enter your new password below.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              editable={false}
              placeholderTextColor="#b0c4de"
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#b0c4de"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#b0c4de"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.resetButton} onPress={handleSubmit}>
              <Text style={styles.resetButtonText}>Reset Password</Text>
            </TouchableOpacity>

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
    backgroundColor: '#00a884',
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
  backToLoginText: {
    color: '#4d6ae4',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
});

export default ResetPasswordScreen;
