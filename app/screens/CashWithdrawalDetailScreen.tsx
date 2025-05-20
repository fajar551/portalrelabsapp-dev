import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CashWithdrawalDetailScreen = ({
  navigateTo,
}: {
  navigateTo: (screen: string) => void;
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateTo('Notification')}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Notifikasi</Text>
      </View>

      {/* Info Atas */}
      <View style={styles.topInfo}>
        <Image source={require('../assets/logo.png')} style={styles.avatar} />
        <View style={{flex: 1}}>
          <Text style={styles.title}>Transaksi Tarik Tunai Berhasil!</Text>
          <Text style={styles.date}>17 Mei 2025 · 14:09:55 WIB</Text>
        </View>
      </View>

      {/* Box Detail */}
      <View style={styles.detailBox}>
        <Text style={styles.detailText}>
          Berikut adalah detail transaksi tarik tunai Anda di ATM Mandiri:
        </Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Token</Text>
          <Text style={styles.detailValue}>Token Tarik - 980094</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Nominal</Text>
          <Text style={styles.detailValue}>Rp 500.000,00</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Rekening Sumber</Text>
          <Text style={styles.detailValue}>
            FAJAR HABIB ZAELANI - 1310021580230
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Lokasi</Text>
          <Text style={styles.detailValue}>BDG AM SUKAMANAH 01</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>No. Referensi</Text>
          <Text style={styles.detailValue}>17052025020915237585</Text>
        </View>
      </View>

      <Text style={styles.infoText}>
        Jika Anda tidak mengenali aktivitas ini, hubungi Mandiri Call 14000
        untuk pengecekan.
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => navigateTo('Notification')}>
        <Text style={styles.logoutButtonText}>Kembali</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f6f6f6'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  detailBox: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 14,
  },
  detailItem: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    color: '#444',
    marginHorizontal: 20,
    marginTop: 10,
    textAlign: 'left',
  },
  logoutButton: {
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CashWithdrawalDetailScreen;
