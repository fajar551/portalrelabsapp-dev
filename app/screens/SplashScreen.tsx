import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
} from 'react-native';

const {width} = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onAnimationComplete}) => {
  // Buat animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  // Animasi untuk logo berputar
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animasi untuk background color gradient
  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#fd7e14'],
  });

  useEffect(() => {
    // Jalankan animasi secara berurutan
    Animated.sequence([
      // 1. Fade in dan scaling logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: false,
        }),
      ]),

      // 2. Putar logo 360 derajat
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bounce,
        useNativeDriver: false,
      }),

      // 3. Ganti background color
      Animated.timing(backgroundColorAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),

      // 4. Tahan sebentar untuk efek visualisasi
      Animated.delay(500),

      // 5. Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Panggil callback setelah animasi selesai
      onAnimationComplete();
    });
  }, [
    fadeAnim,
    scaleAnim,
    rotateAnim,
    backgroundColorAnim,
    onAnimationComplete,
  ]);

  return (
    <Animated.View style={[styles.container, {backgroundColor}]}>
      <StatusBar backgroundColor="#0033a0" barStyle="light-content" />
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}, {rotate: spin}],
          },
        ]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Version Text */}
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
        Versi 1.1
      </Animated.Text>

      {/* Animated circles decoration */}
      <Animated.View
        style={[
          styles.circle,
          styles.circle1,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.7, 0.5],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          styles.circle2,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 0.3],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.2],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          styles.circle3,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.3, 0.2],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1.5],
                }),
              },
            ],
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0033a0',
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: '80%',
    height: '80%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  circle1: {
    width: width * 0.6,
    height: width * 0.6,
  },
  circle2: {
    width: width * 0.9,
    height: width * 0.9,
  },
  circle3: {
    width: width * 1.2,
    height: width * 1.2,
  },
  versionText: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});

export default SplashScreen;
