import React, {useEffect, useState} from 'react';
import AccountScreen from './app/screens/AccountScreen';
import HomeScreen from './app/screens/HomeScreen';
import LoginScreen from './app/screens/LoginScreen';
import PayScreen from './app/screens/PayScreen';
import PaymentSuccessScreen from './app/screens/PaymentSuccessScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');

  // Log saat screen berubah untuk debugging
  useEffect(() => {
    console.log('Current screen changed to:', currentScreen);
  }, [currentScreen]);

  // Fungsi navigasi dengan debugging
  const navigateToScreen = (screen: string) => {
    console.log('Navigating to screen:', screen);
    setCurrentScreen(screen);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  switch (currentScreen) {
    case 'Home':
      return (
        <HomeScreen
          onLogout={() => setIsLoggedIn(false)}
          navigateTo={navigateToScreen}
        />
      );
    case 'Account':
      return (
        <AccountScreen
          onLogout={() => setIsLoggedIn(false)}
          navigateTo={navigateToScreen}
        />
      );
    case 'Pay':
      return (
        <PayScreen
          onLogout={() => setIsLoggedIn(false)}
          navigateTo={navigateToScreen}
        />
      );
    case 'PaymentSuccess':
      return <PaymentSuccessScreen navigateTo={navigateToScreen} />;
    default:
      console.log('Default case triggered, screen:', currentScreen);
      return (
        <HomeScreen
          onLogout={() => setIsLoggedIn(false)}
          navigateTo={navigateToScreen}
        />
      );
  }
}
