/**
 * Contoh Tampilan Notifikasi Android di React Native
 */
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Komponen sederhana yang mensimulasikan tampilan notifikasi Android
const NotificationPreview = ({ title, body, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.notificationContainer}
      onPress={onPress}
    >
      <View style={styles.notificationIconContainer}>
        <Text style={styles.notificationIcon}>🔔</Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationBody}>{body}</Text>
      </View>
      <Text style={styles.notificationTime}>Baru saja</Text>
    </TouchableOpacity>
  );
};

// Contoh beberapa jenis notifikasi yang umum
const NotifikasiContoh = () => {
  const showNotificationDetails = (type) => {
    Alert.alert(
      'Notifikasi Ditekan',
      `Anda telah menekan notifikasi tipe: ${type}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Contoh Tampilan Notifikasi Android</Text>
      <Text style={styles.subheader}>Berikut adalah contoh tampilan beberapa jenis notifikasi yang akan muncul di area notifikasi Android:</Text>

      <View style={styles.notificationsContainer}>
        {/* Notifikasi standar */}
        <NotificationPreview
          title="Portal Relabs"
          body="Selamat datang! Akun Anda berhasil diaktifkan."
          onPress={() => showNotificationDetails('Standar')}
        />

        {/* Notifikasi pesan */}
        <NotificationPreview
          title="Ahmad Santoso"
          body="Halo, bagaimana kabar Anda hari ini? Saya ingin..."
          onPress={() => showNotificationDetails('Pesan')}
        />

        {/* Notifikasi transaksi */}
        <NotificationPreview
          title="Transaksi Berhasil"
          body="Pembayaran Rp500.000 ke Ahmad telah berhasil."
          onPress={() => showNotificationDetails('Transaksi')}
        />

        {/* Notifikasi promo */}
        <NotificationPreview
          title="Promo Spesial!"
          body="Dapatkan diskon 50% untuk semua layanan hari ini."
          onPress={() => showNotificationDetails('Promo')}
        />

        {/* Notifikasi pengingat */}
        <NotificationPreview
          title="Pengingat Jadwal"
          body="Meeting dengan tim akan dimulai dalam 15 menit."
          onPress={() => showNotificationDetails('Pengingat')}
        />
      </View>

      <Text style={styles.note}>
        Catatan: Pada perangkat Android yang sebenarnya, notifikasi akan muncul di area notifikasi
        dengan icon, judul, dan isi pesan seperti contoh di atas. Ketika pengguna menggeser layar
        dari atas ke bawah, mereka akan melihat notifikasi ini dan dapat berinteraksi dengannya.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subheader: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  notificationsContainer: {
    marginBottom: 20,
  },
  notificationContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fd7e14',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#777',
    marginTop: 20,
    lineHeight: 20,
  },
});

export default NotifikasiContoh; 