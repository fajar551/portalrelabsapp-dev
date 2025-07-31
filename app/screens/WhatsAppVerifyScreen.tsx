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
import {whatsappLogin} from '../../src/services/api';

interface WhatsAppVerifyScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onBackToLogin: () => void;
  route: {params: {phoneNumber: string}};
}

const WhatsAppVerifyScreen: React.FC<WhatsAppVerifyScreenProps> = ({
  onBack: _onBack,
  onLoginSuccess,
  onBackToLogin,
  route,
}) => {
  const {phoneNumber} = route.params;
  const [code, setCode] = useState(['', '', '', '']);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  useEffect(() => {
    // Animate version text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length <= 1) {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      // Auto focus to next input
      if (text.length === 1 && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all 4 digits are filled
      if (text.length === 1 && index === 3) {
        const fullCode = newCode.join('');
        if (fullCode.length === 4) {
          // Hardcoded verification code: 1234
          if (fullCode === '1234') {
            // Success - perform login first
            handleWhatsAppLogin();
          } else {
            // Wrong code - clear all inputs
            setCode(['', '', '', '']);
            inputRefs.current[0]?.focus();
          }
        }
      }
    }
  };

  const handleWhatsAppLogin = async () => {
    try {
      // Gunakan fungsi whatsappLogin dari api.ts
      const response = await whatsappLogin(phoneNumber, '1234', 'mobile_app');

      if (response.status === 'success') {
        // Token dan data user sudah disimpan otomatis oleh fungsi whatsappLogin
        // Tampilkan popup sukses
        Alert.alert('Sukses', 'Login WhatsApp berhasil', [
          {
            text: 'OK',
            onPress: () => {
              // Panggil onLoginSuccess untuk navigasi ke HomeScreen
              onLoginSuccess();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Gagal login WhatsApp');
      }
    } catch (error: any) {
      let errorMessage = 'Terjadi kesalahan saat login WhatsApp';

      if (error.message) {
        errorMessage = error.message;
      }

      // Cek apakah error terkait dengan nomor telepon tidak ditemukan
      if (
        errorMessage.includes('Nomor telepon tidak ditemukan') ||
        errorMessage.includes('Token tidak valid') ||
        errorMessage.includes('Token tidak ditemukan') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('Unauthorized')
      ) {
        Alert.alert(
          'Error',
          'Nomor telepon tidak terdaftar. Silakan kembali ke halaman login.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Redirect ke login
                onBackToLogin();
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', errorMessage, [
          {
            text: 'Coba Lagi',
            style: 'cancel',
          },
          {
            text: 'Kembali ke Login',
            onPress: () => {
              // Redirect ke login
              onBackToLogin();
            },
          },
        ]);
      }
    }
  };

  const handleResendCode = () => {
    // Reset code inputs
    setCode(['', '', '', '']);
    inputRefs.current[0]?.focus();
    // Here you would typically call API to resend OTP
    console.log('Resending OTP to:', phoneNumber);
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
            <Text style={styles.title}>Kode Verifikasi</Text>
            <Text style={styles.subtitle}>
              Masukkan kode verifikasi yang telah di kirim ke {phoneNumber}
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
                  placeholder="1"
                  placeholderTextColor="#b0c4de"
                />
              ))}
            </View>

            {/* Send Verification Code Button */}
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleResendCode}>
              <Text style={styles.sendButtonText}>Send Verification Code</Text>
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    color: '#000',
    backgroundColor: '#fff',
    marginTop: 15,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 15,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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

export default WhatsAppVerifyScreen;
