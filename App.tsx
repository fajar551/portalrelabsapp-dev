import messaging from '@react-native-firebase/messaging';
import {NavigationContainer} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import PushNotification from 'react-native-push-notification';
import SessionExpiredModal from './app/components/SessionExpiredModal';
import AccountScreen from './app/screens/AccountScreen';
import CashWithdrawalDetailScreen from './app/screens/CashWithdrawalDetailScreen';
import ForgotPasswordScreen from './app/screens/ForgotPasswordScreen';
import HomeScreen from './app/screens/HomeScreen';
import InvoiceDetailScreen from './app/screens/InvoiceDetailScreen';
import LoginScreen from './app/screens/LoginScreen';
import NotificationScreen from './app/screens/NotificationScreen';
import PayScreen from './app/screens/PayScreen';
import PaymentInstructionsScreen from './app/screens/PaymentInstructionsScreen';
import PaymentSuccessScreen from './app/screens/PaymentSuccessScreen';
import ResetPasswordScreen from './app/screens/ResetPasswordScreen';
import SplashScreen from './app/screens/SplashScreen';
import VerifyCodeScreen from './app/screens/VerifyCodeScreen';
import {
  checkLoginStatus,
  getFCMToken,
  isTokenExpired,
  logoutUser,
} from './src/services/api';

// Type untuk props yang diteruskan ke screens
interface ScreenProps {
  onLogout: () => void;
  navigateTo: (screen: string) => void;
}

// Konfigurasi untuk background message
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('Message handled in the background!', remoteMessage);

//   // Tampilkan notifikasi lokal
//   PushNotification.localNotification({
//     channelId: 'email_channel',
//     title: remoteMessage.notification?.title || 'Notifikasi',
//     message: remoteMessage.notification?.body || 'Ada email baru',
//     playSound: true,
//     soundName: 'default',
//     importance: 'high',
//     vibrate: true,
//     vibration: 300,
//   });
// });

PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  },
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
  requestPermissions: true,
});

// Buat channel untuk Android
PushNotification.createChannel(
  {
    channelId: 'email_channel',
    channelName: 'Email Notifications',
    channelDescription: 'Channel for email notifications',
    playSound: true,
    soundName: 'default',
    importance: 4,
    vibrate: true,
  },
  created => console.log(`Channel created: ${created}`),
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // State untuk menampilkan splash screen
  const [resetPasswordData, setResetPasswordData] = useState<{
    token: string;
    email: string;
  }>({token: '', email: ''});

  // Menyimpan email yang dimasukkan di ForgotPasswordScreen
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Periksa token expired setiap interval
  useEffect(() => {
    const checkSession = async () => {
      if (isLoggedIn) {
        const expired = await isTokenExpired();
        if (expired) {
          setSessionExpired(true);
        }
      }
    };

    // Periksa session setiap 1 menit
    const sessionCheckInterval = setInterval(checkSession, 60000);

    return () => clearInterval(sessionCheckInterval);
  }, [isLoggedIn]);

  useEffect(() => {
    // Periksa status login saat aplikasi dimulai - tunggu splash selesai
    const checkAuth = async () => {
      try {
        const loggedIn = await checkLoginStatus();

        // Jika logged in, cek juga apakah token sudah expired
        if (loggedIn) {
          const expired = await isTokenExpired();
          if (expired) {
            await logoutUser(); // Logout jika token sudah expired
            setIsLoggedIn(false);
          } else {
            setIsLoggedIn(true);
            setCurrentScreen('Home'); // Selalu ke Home saat memulai aplikasi
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Hanya lakukan checkAuth jika splash screen sudah selesai
    if (!showSplash) {
      checkAuth();
    }
  }, [showSplash]);

  useEffect(() => {
    // Inisialisasi Linking untuk deep links
    const linkingEventListener = Linking.addEventListener(
      'url',
      handleDeepLink,
    );

    // Handle deep link saat aplikasi dibuka melalui URL
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          handleDeepLink({url});
        }
      })
      .catch(err => console.error('Error getting initial URL:', err));

    return () => {
      linkingEventListener.remove();
    };
  }, []);

  const showNotificationPrompt = () => {
    Alert.alert(
      'Izinkan Notifikasi',
      'Aplikasi membutuhkan izin untuk mengirim notifikasi. Aktifkan sekarang?',
      [
        {
          text: 'Tidak',
          style: 'cancel',
        },
        {
          text: 'Izinkan',
          onPress: () => messaging().requestPermission(),
        },
      ],
      {cancelable: false},
    );
  };

  useEffect(() => {
    messaging()
      .hasPermission()
      .then(status => {
        if (
          status === messaging.AuthorizationStatus.NOT_DETERMINED ||
          status === messaging.AuthorizationStatus.DENIED
        ) {
          showNotificationPrompt();
        }
      });
  }, []);

  // Handler ketika animasi splash screen selesai
  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
    setSessionExpired(false);
    setCurrentScreen('Home');
    // Panggil getFCMToken setelah login berhasil
    await getFCMToken();
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
  };

  const handleSessionExpired = () => {
    handleLogout();
    setSessionExpired(false);
  };

  // Fungsi navigasi dengan log untuk debugging
  const navigateToScreen = (screen: string, params?: any) => {
    console.log('Navigating to:', screen, params);
    setCurrentScreen(screen);

    // Jika navigasi ke ForgotPassword, reset email
    if (screen === 'ForgotPassword') {
      setForgotPasswordEmail('');
    }

    // Jika navigasi ke VerifyCode, simpan email
    if (screen === 'VerifyCode' && params?.email) {
      setForgotPasswordEmail(params.email);
    }
  };

  // Fungsi untuk menangani deep links
  const handleDeepLink = ({url}: {url: string}) => {
    console.log('Deep link URL:', url);

    // Handle app://reset-password deep link
    if (url.startsWith('app://reset-password')) {
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const email = urlObj.searchParams.get('email');

        if (token && email) {
          console.log('Reset password token:', token);
          console.log('Reset password email:', email);

          // Navigate to ResetPasswordScreen
          setCurrentScreen('ResetPassword');
          // Pass token dan email sebagai props
          setResetPasswordData({token, email});
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }

    // Handle https://portal.relabs.id/reset-redirect deep link
    if (url.includes('/reset-redirect')) {
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const email = urlObj.searchParams.get('email');

        if (token && email) {
          console.log('Reset password token from web:', token);
          console.log('Reset password email from web:', email);

          // Navigate to ResetPasswordScreen
          setCurrentScreen('ResetPassword');
          // Pass token dan email sebagai props
          setResetPasswordData({token, email});
        }
      } catch (error) {
        console.error('Error parsing URL:', error);
      }
    }
  };

  // Pindahkan useEffect ke sini
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      PushNotification.localNotification({
        channelId: 'email_channel',
        title: remoteMessage.notification?.title || 'Notifikasi',
        message: remoteMessage.notification?.body || 'Ada email baru',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        vibrate: true,
        vibration: 300,
        smallIcon: 'ic_launcher',
        priority: 'high',
        invokeApp: true,
      });
    });
    return unsubscribe;
  }, []);

  // Jika splash screen masih ditampilkan
  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0033a0" />
      </View>
    );
  }

  // Render session expired modal
  const renderSessionExpiredModal = () => (
    <SessionExpiredModal
      visible={sessionExpired}
      onClose={handleSessionExpired}
    />
  );

  // Props untuk screens
  const screenProps: ScreenProps = {
    onLogout: handleLogout,
    navigateTo: navigateToScreen,
  };

  // Tambahkan console.log untuk debugging
  console.log('Current screen:', currentScreen);

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        <>
          {currentScreen === 'ForgotPassword' ? (
            <ForgotPasswordScreen
              navigateToScreen={(screen, params) =>
                navigateToScreen(screen, params)
              }
            />
          ) : currentScreen === 'VerifyCode' ? (
            <VerifyCodeScreen
              navigateToScreen={navigateToScreen}
              onLoginSuccess={handleLoginSuccess}
              route={{params: {email: forgotPasswordEmail}}}
            />
          ) : currentScreen === 'ResetPassword' ? (
            <ResetPasswordScreen
              navigateToScreen={navigateToScreen}
              route={{params: resetPasswordData}}
            />
          ) : (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              navigateToScreen={navigateToScreen}
            />
          )}
        </>
      ) : (
        <>
          {/* Render halaman aktif */}
          {(() => {
            switch (currentScreen) {
              case 'Home':
                return <HomeScreen {...screenProps} />;
              case 'Account':
                return <AccountScreen {...screenProps} />;
              case 'Pay':
                return <PayScreen {...screenProps} />;
              case 'Notification':
                return <NotificationScreen {...screenProps} />;
              case 'PaymentSuccess':
                return <PaymentSuccessScreen navigateTo={navigateToScreen} />;
              case 'CashWithdrawalDetail':
                return <CashWithdrawalDetailScreen {...screenProps} />;
              case 'InvoiceDetail':
                return (
                  <InvoiceDetailScreen
                    navigateTo={navigateToScreen}
                    onLogout={handleLogout}
                  />
                );
              case 'PaymentInstructions':
                return (
                  <PaymentInstructionsScreen
                    navigateTo={navigateToScreen}
                    onLogout={handleLogout}
                  />
                );
              default:
                console.log('Default case triggered, showing Home');
                return <HomeScreen {...screenProps} />;
            }
          })()}
        </>
      )}
      {renderSessionExpiredModal()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
