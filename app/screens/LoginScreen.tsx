import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'fajar' && password === '123') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Login Member Area</Text>
        <Text style={styles.subtitle}>
          Please insert your Email and Password to Login
        </Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#b0c4de"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#b0c4de"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.rememberRow}>
          <CheckBox
            value={remember}
            onValueChange={setRemember}
            style={styles.checkbox}
          />
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        {error ? (
          <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.signupText}>Create a New Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
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
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8a98b7',
    fontSize: 14,
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    color: '#22325a',
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    fontSize: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#eaf2ff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    marginBottom: 6,
    color: '#22325a',
  },
  forgot: {
    color: '#b0c4de',
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: 2,
    fontSize: 13,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 18,
    marginTop: 2,
  },
  checkbox: {
    marginRight: 8,
  },
  rememberText: {
    color: '#22325a',
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: '#ffb84d',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    marginTop: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  signupText: {
    color: '#3b82f6',
    fontSize: 15,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default LoginScreen;