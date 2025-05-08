import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const {width} = Dimensions.get('window');

const PaymentSuccessScreen = ({
  navigateTo,
}: {
  navigateTo: (screen: string) => void;
  onClose?: () => void;
}) => {
  // Fungsi untuk kembali ke halaman Home
  const handleGoHome = () => {
    console.log('Navigating to Home screen');
    navigateTo('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />

      {/* Tombol Close dengan area yang lebih besar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleGoHome}
          activeOpacity={0.6}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{marginTop: 60}}>
        <View style={styles.topSection}>
          <View style={styles.robotContainer}>
            <Image
              source={require('../assets/guarantee.webp')}
              style={styles.robotImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.successTitle}>Successful Payment</Text>
        </View>

        <View style={[styles.billContainer, {width: width - 40}]}>
          <View style={styles.billHeader}>
            <Text style={styles.billMonth}>April 2025</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Bill</Text>
            <Text style={styles.billAmount}>Rp 234.765</Text>
          </View>

          <View style={styles.statusContainer}>
            <Text style={styles.paidStatus}>Paid</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Billing Statement Date</Text>
            <Text style={styles.billValue}>07 Apr 2025</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Rincian Tagihan</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>PREVIOUS BALANCE</Text>
            <Text style={styles.billValue}>Rp 234.765</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment - Thank you</Text>
            <Text style={styles.billValueNegative}>-Rp 234.765</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Charges</Text>
            <Text style={styles.billValue}>Rp 5.000</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billValue}>Rp 550</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>*MONTHLY CHARGES*</Text>
            <Text style={styles.billValue}>Rp 0</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>FN JOY_VALUE SPC 50 12M</Text>
            <Text style={styles.billValue}>Rp 41.800</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>HC JOY_VALUE SPC 50 12M</Text>
            <Text style={styles.billValue}>Rp 62.700</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>MODEM 3.0 CHARGE</Text>
            <Text style={styles.billValue}>Rp 30.000</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>ROUTER D 3.0 CHARGE</Text>
            <Text style={styles.billValue}>Rp 20.000</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>STB HD CHARGE</Text>
            <Text style={styles.billValue}>Rp 46.000</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>E-BILLING FEE</Text>
            <Text style={styles.billValue}>Rp 6.000</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>*PRORATED BILLING AMOUNT*</Text>
            <Text style={styles.billValue}>Rp 0</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billValue}>Rp 22.715</Text>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => console.log('Share button pressed')}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tombol navigasi ke home di bagian bawah sebagai fallback */}
      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>Kembali ke Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(200,200,200,0.3)',
  },
  closeIcon: {
    fontSize: 24,
    color: '#333',
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  robotContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  robotImage: {
    width: 60,
    height: 60,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  billContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billHeader: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
  },
  billMonth: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  billAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  billValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  billValueNegative: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'right',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  paidStatus: {
    fontSize: 14,
    color: 'white',
    backgroundColor: '#27ae60',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
    overflow: 'hidden',
  },
  shareButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  shareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  homeButton: {
    backgroundColor: '#2e7ce4',
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  homeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentSuccessScreen;
