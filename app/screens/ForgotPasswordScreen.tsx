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

interface ForgotPasswordScreenProps {
  navigateToScreen: (screen: string, params?: any) => void;
  route?: {params: {email?: string; token?: string}};
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigateToScreen,
  // route,
}) => {
  const [email, setEmail] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate version text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleResetPassword = async () => {
    if (!email || !email.trim()) {
      Alert.alert('Error', 'Masukkan email yang valid');
      return;
    }

    try {
      // Kirim request forgot password
      const response = await axios.post(
        'https://portal.relabs.id/mobile/forgot-password',
        {
          email: email,
        },
      );

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
              source={{
                uri: 'https://portal.internetan.id/mobile/img/qwords.png',
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Mengubah Password</Text>
            <Text style={styles.subtitle}>
              Silakan masukkan email Anda untuk menerima instruksi untuk mereset
              password.
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
              onPress={handleResetPassword}>
              <Text style={styles.resetButtonText}>Send Verification Code</Text>
            </TouchableOpacity>

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>Or</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigateToScreen('Login')}>
              <Image
                source={{
                  uri: 'https://portal.internetan.id/mobile/img/backIconorange.png',
                }}
                style={styles.backToLoginIcon}
                resizeMode="contain"
              />
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
    color: 'rgba(0, 0, 0, 1)r5',
  },
  resetButton: {
    backgroundColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // marginBottom: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 5,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    color: '#8a98b7',
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 16,
    paddingVertical: 6,
    // paddingHorizontal: 9,
    width: '100%',
    marginBottom: 10,
  },
  backToLoginIcon: {
    width: 8,
    height: 12,
    marginRight: 8,
    marginTop: 1,
    color: 'rgba(246, 138, 9, 1)',
  },
  backToLoginText: {
    color: 'rgba(246, 138, 9, 1)',
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

export default ForgotPasswordScreen;
