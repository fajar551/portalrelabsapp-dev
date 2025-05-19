import React, {useState} from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Interface untuk tipe item notifikasi
interface NotificationItemProps {
  title: string;
  body: string;
  time: string;
}

// Komponen item notifikasi dengan format sesuai gambar
const NotificationItem = ({
  title,
  body,
  time,
  onPress,
  isRead,
}: NotificationItemProps & {onPress: () => void; isRead: boolean}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.notificationItem}>
        {!isRead && <View style={styles.notificationDot} />}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationBody}>{body}</Text>
        </View>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Komponen TabItem dipindahkan ke luar NotificationScreen
interface TabItemProps {
  title: string;
  activeTab: string;
  onPress: (title: string) => void;
}

const TabItem = ({title, activeTab, onPress}: TabItemProps) => (
  <TouchableOpacity
    style={[styles.tabItem, activeTab === title ? styles.activeTab : null]}
    onPress={() => onPress(title)}>
    <Text
      style={[
        styles.tabText,
        activeTab === title ? styles.activeTabText : null,
      ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const NotificationScreen = ({
  navigateTo,
}: {
  navigateTo: (screen: string) => void;
}) => {
  // State untuk tab yang aktif
  const [activeTab, setActiveTab] = useState('Notifikasi');
  const [selectedNotification, setSelectedNotification] = useState<null | any>(
    null,
  );
  const [readNotifications, setReadNotifications] = useState<number[]>([]);

  // Data dummy untuk notifikasi
  const notificationData = [
    {
      id: 1,
      title: 'Transaksi Tarik Tunai Berhasil!',
      body: 'Berikut adalah detail transaksi tarik tunai Anda di ATM Mandiri: Token Tarik - 980094',
      time: '17 Mei',
    },
    {
      id: 2,
      title: 'Token Tarik Tunai Sudah Digunakan',
      body: 'Token berikut sudah digunakan. Kunjungi Mutasi Transaksi untuk cek transaksi Anda. No. Ref.',
      time: '17 Mei',
    },
    {
      id: 3,
      title: 'Token Tarik Tunai Siap Digunakan',
      body: 'Berikut adalah Token Tarik Tunai Anda. Segera gunakan di ATM terdekat sebelum masa',
      time: '17 Mei',
    },
    {
      id: 4,
      title: 'Transaksi Tarik Tunai Berhasil!',
      body: 'Berikut adalah detail transaksi tarik tunai Anda di ATM Mandiri: Token Tarik - 456332',
      time: '17 Mei',
    },
    {
      id: 5,
      title: 'Token Tarik Tunai Sudah Digunakan',
      body: 'Token berikut sudah digunakan. Kunjungi Mutasi Transaksi untuk cek transaksi Anda. No. Ref.',
      time: '17 Mei',
    },
    {
      id: 6,
      title: 'Token Tarik Tunai Siap Digunakan',
      body: 'Berikut adalah Token Tarik Tunai Anda. Segera gunakan di ATM terdekat sebelum masa',
      time: '17 Mei',
    },
    {
      id: 7,
      title: "Akses Terbaru ke Livin' by Mandiri",
      body: 'Kami mendeteksi Anda baru saja melakukan verifikasi untuk mengakses aplikasi',
      time: '26 Mar',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigateTo('Home')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pesan</Text>
        <TouchableOpacity style={styles.soundButton}>
          <Text style={styles.soundButtonText}>🔊</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabItem title="Tagihan" activeTab={activeTab} onPress={setActiveTab} />
        <TabItem
          title="Notifikasi"
          activeTab={activeTab}
          onPress={setActiveTab}
        />
      </View>

      {/* Indicator line for active tab */}
      <View style={styles.tabIndicatorContainer}>
        <View
          style={[
            styles.tabIndicator,
            activeTab === 'Tagihan'
              ? styles.notifikasiIndicator
              : styles.resiIndicator,
          ]}
        />
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigateTo('Home')}>
          <Text style={styles.logoutButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* Daftar Notifikasi */}
      <ScrollView style={styles.notificationsList}>
        {notificationData.map(notification => (
          <NotificationItem
            key={notification.id}
            title={notification.title}
            body={notification.body}
            time={notification.time}
            isRead={readNotifications.includes(notification.id)}
            onPress={() => {
              if (notification.title === 'Transaksi Tarik Tunai Berhasil!') {
                navigateTo('CashWithdrawalDetail');
              }
              setReadNotifications(prev => [
                ...new Set([...prev, notification.id]),
              ]);
            }}
          />
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedNotification(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Ilustrasi */}
            <Image
              source={require('../assets/logo.png')}
              style={styles.modalImage}
            />
            {/* Judul */}
            <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
            {/* Detail transaksi */}
            <Text style={styles.modalDate}>17 Mei 2025 · 14:09:55 WIB</Text>
            <View style={styles.modalDetail}>
              <Text>
                Token: <Text style={styles.fwBold}>Token Tarik - 980094</Text>
              </Text>
              <Text>
                Nominal: <Text style={styles.fwBold}>Rp 500.000,00</Text>
              </Text>
              <Text>
                Rekening Sumber:{' '}
                <Text style={styles.fwBold}>
                  FAJAR HABIB ZAELANI - 1310021580230
                </Text>
              </Text>
              <Text>
                Lokasi: <Text style={styles.fwBold}>BDG AM SUKAMANAH 01</Text>
              </Text>
              <Text>
                No. Referensi:{' '}
                <Text style={styles.fwBold}>17052025020915237585</Text>
              </Text>
            </View>
            <Text style={styles.modalInfo}>
              Jika Anda tidak mengenali aktivitas ini, hubungi Mandiri Call
              14000 untuk pengecekan.
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedNotification(null)}
              style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  fwBold: {
    fontWeight: 'bold',
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutButton: {
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  soundButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundButtonText: {
    fontSize: 20,
    color: '#fd7e14',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  activeTabText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  tabIndicatorContainer: {
    height: 3,
    backgroundColor: '#fff',
    position: 'relative',
    marginTop: -3,
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: 3,
    backgroundColor: '#fd7e14',
    bottom: 0,
    transform: [{translateX: -50}],
  },
  notifikasiIndicator: {
    left: '13%',
  },
  resiIndicator: {
    left: '65%',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoAction: {
    fontSize: 16,
    color: '#fd7e14',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCC00',
    marginTop: 8,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 10,
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
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
  },
  modalImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8,
  },
  modalDate: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 12,
  },
  modalDetail: {
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  modalCloseText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
});

export default NotificationScreen;
