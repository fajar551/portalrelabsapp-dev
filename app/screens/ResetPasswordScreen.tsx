import axios from 'axios';
import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ambil parameter dari deep link
    if (route && route.params) {
      setEmail(route.params.email || '');
      setToken(route.params.token || '');
    }
  }, [route]);

  useEffect(() => {
    // Animate version text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
        'https://portal.internetan.id/mobile/reset-password',
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
              source={{
                uri: 'https://portal.internetan.id/mobile/img/qwords.png',
              }}
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>PT Relabs Net DayaCipta 2025</Text>
            <Text style={styles.footerText}>Relabs adalah anggota dari</Text>
            <Text style={styles.footerText}>
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
    borderRadius: 10,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
    alignItems: 'center',
  },
  logo: {
    width: 111,
    height: 111,
    marginTop: -15,
    marginBottom: -10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 1)',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 14,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 24,
  },
  label: {
    alignSelf: 'flex-start',
    color: 'rgba(0, 0, 0, 1)',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 7,
    fontSize: 16,
    marginBottom: 20,
    borderColor: 'rgba(246, 138, 9, 1)',
    borderWidth: 1,
    color: 'rgba(0, 0, 0, 1)',
  },
  resetButton: {
    backgroundColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 16,
    paddingVertical: 10,
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
    color: '#ffb444',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
    marginBottom: 5,
  },
  versionText: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '400',
  },
});

export default ResetPasswordScreen;
