import React, {useEffect, useRef, useState} from 'react';
import {
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
import LinearGradient from 'react-native-linear-gradient';

interface WhatsAppLoginScreenProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onNavigateToVerify: (phoneNumber: string) => void;
}

const WhatsAppLoginScreen: React.FC<WhatsAppLoginScreenProps> = ({
  onBack,
  onLoginSuccess: _onLoginSuccess,
  onNavigateToVerify,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate version text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Nomor WhatsApp harus diisi');
      return;
    }

    if (phoneNumber.length < 10) {
      setError('Nomor WhatsApp tidak valid');
      return;
    }

    try {
      // Implementasi pengiriman OTP ke WhatsApp
      console.log('Mengirim OTP ke:', phoneNumber);

      // Simulasi pengiriman OTP berhasil
      setError('');
      // Navigasi ke halaman verifikasi OTP
      onNavigateToVerify(phoneNumber);
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Gagal mengirim kode OTP. Silakan coba lagi.');
    }
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

              <Text style={styles.title}>Masuk dengan WhatsApp</Text>
              <Text style={styles.subtitle}>
                Kami akan Kirimkan Kode OTP ke Nomor{'\n'}WhatsApp Anda
              </Text>

              <Text style={styles.label}>Nomor WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan Nomor Anda"
                placeholderTextColor="#b0c4de"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.sendOTPButton}
                onPress={handleSendOTP}>
                <Text style={styles.sendOTPButtonText}>Kirim Kode OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Image
                  source={{
                    uri: 'https://portal.internetan.id/mobile/img/backIcon.png',
                  }}
                  style={styles.backButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.backButtonText}>Kembali</Text>
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
    lineHeight: 24,
  },
  label: {
    alignSelf: 'flex-start',
    color: 'rgba(0, 0, 0, 1)',
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonIcon: {
    width: 8,
    height: 12,
    marginRight: 6,
    marginTop: 1,
  },
  backButtonText: {
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 14,
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
  sendOTPButton: {
    backgroundColor: 'rgba(246, 138, 9, 1)',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    height: 40,
    width: '100%',
    marginBottom: 20,
  },
  sendOTPButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  versionText: {
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 1)',
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '400',
  },
});

export default WhatsAppLoginScreen;
