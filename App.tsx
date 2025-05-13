import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import SessionExpiredModal from './app/components/SessionExpiredModal';
import AccountScreen from './app/screens/AccountScreen';
import HomeScreen from './app/screens/HomeScreen';
import InvoiceDetailScreen from './app/screens/InvoiceDetailScreen';
import LoginScreen from './app/screens/LoginScreen';
import PayScreen from './app/screens/PayScreen';
import PaymentSuccessScreen from './app/screens/PaymentSuccessScreen';
import {checkLoginStatus, isTokenExpired, logoutUser} from './src/services/api';

// Type untuk props yang diteruskan ke screens
interface ScreenProps {
  onLogout: () => void;
  navigateTo: (screen: string) => void;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [sessionExpired, setSessionExpired] = useState(false);

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
    // Periksa status login saat aplikasi dimulai
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

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setSessionExpired(false);
    setCurrentScreen('Home');
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
  const navigateToScreen = (screen: string) => {
    console.log('Navigating to:', screen);
    setCurrentScreen(screen);
  };

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

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        {renderSessionExpiredModal()}
      </>
    );
  }

  // Props untuk screens
  const screenProps: ScreenProps = {
    onLogout: handleLogout,
    navigateTo: navigateToScreen,
  };

  // Tambahkan console.log untuk debugging
  console.log('Current screen:', currentScreen);

  return (
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
          case 'PaymentSuccess':
            return <PaymentSuccessScreen navigateTo={navigateToScreen} />;
          case 'InvoiceDetail':
            return <InvoiceDetailScreen navigateTo={navigateToScreen} />;
          default:
            console.log('Default case triggered, showing Home');
            return <HomeScreen {...screenProps} />;
        }
      })()}

      {/* Render modal session expired */}
      {renderSessionExpiredModal()}
    </>
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
