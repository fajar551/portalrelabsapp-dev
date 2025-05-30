import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PushNotification from 'react-native-push-notification';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {getNotifications} from '../../src/services/api';

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

const READ_KEY = 'READ_NOTIFICATIONS';
const READ_BILL_KEY = 'READ_BILLS';

const loadReadNotifications = async () => {
  const data = await AsyncStorage.getItem(READ_KEY);
  return data ? JSON.parse(data) : [];
};

const loadReadBills = async () => {
  const data = await AsyncStorage.getItem(READ_BILL_KEY);
  return data ? JSON.parse(data) : [];
};

const saveReadNotifications = async (ids: number[]) => {
  try {
    console.log('Menyimpan notifikasi yang sudah dibaca:', ids);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(ids));
    console.log('Berhasil menyimpan ke AsyncStorage');
  } catch (error) {
    console.error('Error saving to AsyncStorage:', error);
  }
};

const saveReadBills = async (ids: number[]) => {
  await AsyncStorage.setItem(READ_BILL_KEY, JSON.stringify(ids));
};

// Tambahkan interface untuk notifikasi
interface Notification {
  id: number;
  subject: string;
  message: string;
  date: string;
}

const NotificationScreen = ({
  navigateTo,
}: {
  navigateTo: (screen: string, params?: any) => void;
}) => {
  const insets = useSafeAreaInsets();
  // State untuk tab yang aktif
  const [activeTab, setActiveTab] = useState('Tagihan');
  const [readNotifications, setReadNotifications] = useState<number[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [readBills, setReadBills] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 detik

  useFocusEffect(
    React.useCallback(() => {
      loadReadNotifications().then(setReadNotifications);
      loadReadBills().then(setReadBills);
    }, []),
  );

  useEffect(() => {
    setLoading(true);
    getNotifications()
      .then(data => setNotifications(data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  // Pindahkan fungsi ini ke dalam komponen
  // const resetReadNotifications = async () => {
  //   await AsyncStorage.removeItem(READ_KEY);
  //   setReadNotifications([]);
  //   await AsyncStorage.removeItem(READ_BILL_KEY);
  //   setReadBills([]);
  // };

  // Fungsi untuk mengambil isi <p>, <li>, <ol>, <h6> dari HTML
  const extractTextFromHtml = (html: string) => {
    if (!html) {
      return '';
    }

    // Cek jika ada <td class="bodyContent">...</td>
    const bodyContentMatch = html.match(
      /<td[^>]*class=["']bodyContent["'][^>]*>([\s\S]*?)<\/td>/i,
    );
    if (bodyContentMatch && bodyContentMatch[1]) {
      const bodyHtml = bodyContentMatch[1];
      // Ambil isi <p>, <li>, <h6> di dalam bodyContent
      const pMatches = bodyHtml.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
      const liMatches = bodyHtml.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
      const h6Matches = bodyHtml.match(/<h6[^>]*>(.*?)<\/h6>/gis) || [];
      const all = [...h6Matches, ...pMatches, ...liMatches].map(str =>
        str
          .replace(/<br\s*\/?/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\\n/g, '\n')
          .trim(),
      );
      // Jika tidak ada tag <p>, <li>, <h6>, fallback ke isi mentah
      if (all.length === 0) {
        return bodyHtml
          .replace(/<!--.*?-->/gs, '')
          .replace(/<br\s*\/?/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/\\n/g, '\n')
          .trim();
      }
      return all.join('\n\n');
    }

    // Ambil isi <p>
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gis) || [];
    // Ambil isi <li>
    const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
    // Ambil isi <h6>
    const h6Matches = html.match(/<h6[^>]*>(.*?)<\/h6>/gis) || [];

    // Gabungkan semua hasil
    const all = [...h6Matches, ...pMatches, ...liMatches].map(str =>
      str
        .replace(/<br\s*\/?/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\\n/g, '\n')
        .trim(),
    );
    // Gabungkan dengan newline antar paragraf
    return all.join('\n\n');
  };

  // Fungsi untuk delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Fungsi untuk mengecek email baru dengan useCallback
  const checkNewEmails = useCallback(async () => {
    try {
      const currentNotifications = await getNotifications();

      // Bandingkan dengan notifikasi yang sudah ada
      const newEmails = currentNotifications.filter(
        (notification: Notification) =>
          !notifications.some(existing => existing.id === notification.id) &&
          notification.subject.includes('@'),
      );

      // Jika ada email baru, tampilkan notifikasi
      if (newEmails.length > 0) {
        newEmails.forEach((email: Notification) => {
          // Kirim notifikasi lokal menggunakan PushNotification
          PushNotification.localNotification({
            channelId: 'email_channel',
            title: 'Email Baru',
            message: email.subject,
            playSound: true,
            soundName: 'default',
            importance: 'high',
            vibrate: true,
            vibration: 300,
            userInfo: {id: email.id.toString()},
          });
        });
      }

      // Update state notifications
      setNotifications(currentNotifications);
      // Reset retry count jika berhasil
      setRetryCount(0);
    } catch (error) {
      console.error('Error checking new emails:', error);

      // Implementasi retry mechanism
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Retrying in ${RETRY_DELAY / 1000} seconds... (Attempt ${
            retryCount + 1
          }/${MAX_RETRIES})`,
        );
        setRetryCount(prev => prev + 1);
        await delay(RETRY_DELAY);
        checkNewEmails();
      } else {
        console.error(
          'Max retries reached. Please check your network connection.',
        );
        setRetryCount(0); // Reset retry count
      }
    }
  }, [notifications, retryCount]);

  // Setup interval untuk mengecek email baru setiap 5 menit
  useEffect(() => {
    let isMounted = true;

    const checkEmails = async () => {
      if (isMounted) {
        await checkNewEmails();
      }
    };

    // Cek email pertama kali
    checkEmails();

    // Setup interval
    const intervalId = setInterval(checkEmails, 5 * 60 * 1000); // 5 menit

    // Cleanup interval saat komponen unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [checkNewEmails]);

  // Fungsi untuk request permission notifikasi
  const requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  };

  useEffect(() => {
    // Hanya request permission saat komponen mount
    requestPermission();
  }, []);

  // Setup FCM listener untuk notifikasi
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.type === 'email') {
        // Refresh daftar notifikasi
        const updatedNotifications = await getNotifications();
        setNotifications(updatedNotifications);
      }
    });

    return unsubscribe;
  }, []);

  // Fungsi untuk mengetes notifikasi lokal
  // const testPushNotification = () => {
  //   console.log('Tombol Tes Notifikasi ditekan');
  //   PushNotification.localNotification({
  //     /* Android Only Properties */
  //     channelId: 'email_channel',
  //     title: 'Tes Notifikasi',
  //     message: 'Ini adalah notifikasi tes dari aplikasi',
  //     playSound: true,
  //     soundName: 'default',
  //     importance: 'high',
  //     vibrate: true,
  //     vibration: 300,
  //     /* iOS and Android properties */
  //     userInfo: {id: 'test'},
  //   });
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigateTo('Home')}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifikasi</Text>
        </View>
        <View style={styles.backButton} />
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

      {/* <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => navigateTo('Home')}>
          <Text style={styles.logoutButtonText}>Beranda</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoutContainer2}>
        <TouchableOpacity
          style={styles.logoutButton2}
          onPress={resetReadNotifications}>
          <Text style={styles.logoutButtonText2}>Reset Penanda</Text>
        </TouchableOpacity>
      </View> */}

      {/* <View style={styles.logoutContainer2}>
        <TouchableOpacity
          style={[styles.logoutButton2, {backgroundColor: '#28a745'}]}
          onPress={testPushNotification}>
          <Text style={styles.logoutButtonText2}>Tes Notifikasi</Text>
        </TouchableOpacity>
      </View> */}

      {/* Daftar Notifikasi atau Tagihan */}
      {activeTab === 'Notifikasi' ? (
        <ScrollView
          style={[
            styles.notificationsList,
            {paddingBottom: 80 + insets.bottom},
          ]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fd7e14" />
              <Text style={styles.loadingText}>Memuat notifikasi...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <Text style={[styles.ta, styles.mt20]}>Tidak ada notifikasi</Text>
          ) : (
            notifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                onPress={async () => {
                  try {
                    const updated = [
                      ...new Set([...readNotifications, notification.id]),
                    ];
                    await saveReadNotifications(updated);
                    setReadNotifications(updated);
                    setSelectedNotification(notification);
                  } catch (error) {
                    console.error('Error saving read notification:', error);
                  }
                }}>
                <View style={styles.notificationItem}>
                  {!readNotifications.includes(notification.id) && (
                    <View style={styles.notificationDot} />
                  )}
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.subject}
                    </Text>
                  </View>
                  <Text style={styles.notificationTime}>
                    {notification.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{height: 100 + insets.bottom}} />
        </ScrollView>
      ) : (
        <ScrollView
          style={[
            styles.notificationsList,
            {paddingBottom: 80 + insets.bottom},
          ]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fd7e14" />
              <Text style={styles.loadingText}>Memuat tagihan...</Text>
            </View>
          ) : notifications.filter(
              n =>
                n.subject &&
                n.subject.includes(
                  '[Tagihan] Pembayaran Layanan Internet Qwords',
                ),
            ).length === 0 ? (
            <Text style={[styles.ta, styles.mt20]}>Tidak ada tagihan</Text>
          ) : (
            notifications
              .filter(
                n =>
                  n.subject &&
                  n.subject.includes(
                    '[Tagihan] Pembayaran Layanan Internet Qwords',
                  ),
              )
              .map(tagihan => (
                <TouchableOpacity
                  key={tagihan.id}
                  onPress={() => {
                    setReadBills(prev => {
                      const updated = [...new Set([...prev, tagihan.id])];
                      saveReadBills(updated);
                      return updated;
                    });
                    setSelectedNotification(tagihan);
                  }}>
                  <View style={styles.billItem}>
                    {!readBills.includes(tagihan.id) && (
                      <View style={styles.notificationDotTagihan} />
                    )}
                    <View style={styles.billInfo}>
                      <Text style={styles.billTitle}>{tagihan.subject}</Text>
                      <Text style={styles.billLabel}>{tagihan.date}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
          )}
          <View style={{height: 100 + insets.bottom}} />
        </ScrollView>
      )}

      {/* Modal Detail Notifikasi */}
      {selectedNotification && (
        <View style={styles.qwordsModalOverlay}>
          <View style={styles.qwordsModalContainer}>
            {/* Header gelap dengan logo */}
            <View style={styles.qwordsModalHeader}>
              <Text style={styles.qwordsBrand}>Pesan</Text>
            </View>
            {/* Body abu-abu dengan ScrollView agar konten bisa discroll */}
            <ScrollView
              style={styles.qwordsModalBody}
              contentContainerStyle={styles.qwordsModalBodyContent}>
              <Text style={styles.qwordsText}>
                {extractTextFromHtml(selectedNotification.message)
                  .split('\n')
                  .map(line => line.replace(/^>/, '').trim())
                  .join('\n')
                  .replace(/\n{3,}/g, '\n\n')}
              </Text>
            </ScrollView>
            {/* Footer */}
            <View style={styles.qwordsModalFooter}>
              <Text style={styles.qwordsFooterText}>
                visit our website | log in to your account | get support |
                Copyright © PT Relabs Net DayaCipta, All rights reserved.
              </Text>
            </View>
            {/* Tombol Tutup */}
            <TouchableOpacity
              onPress={() => setSelectedNotification(null)}
              style={styles.qwordsModalCloseButton}>
              <Text style={styles.qwordsModalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View
        style={[
          styles.bottomNav,
          styles.bottomNavFixed,
          {paddingBottom: insets.bottom},
        ]}>
        {/* ...icon nav... */}
      </View>
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
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  fwBold: {
    fontWeight: 'bold',
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
    // marginVertical: 20,
  },
  ta: {
    textAlign: 'center',
  },
  mt20: {
    marginTop: 20,
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
  logoutContainer2: {
    padding: 20,
    alignItems: 'center',
    // marginVertical: 5,
  },
  logoutButton2: {
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    // paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText2: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
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
  notificationDotTagihan: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFCC00',
    marginTop: -40,
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
  qwordsModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  qwordsModalContainer: {
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    width: '92%',
    maxHeight: '90%',
    padding: 0,
    overflow: 'hidden',
    flexShrink: 1,
  },
  qwordsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  qwordsLogo: {
    width: 48,
    height: 32,
    resizeMode: 'contain',
    marginRight: 10,
  },
  qwordsBrand: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  qwordsModalBody: {
    padding: 18,
    flexGrow: 1,
    minHeight: 60,
    maxHeight: 350,
    backgroundColor: '#fff',
  },
  qwordsModalBodyContent: {
    paddingBottom: 18,
  },
  qwordsText: {
    color: '#23242a',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  qwordsBold: {
    fontWeight: 'bold',
    color: '#23242a',
  },
  qwordsLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  qwordsDetailTable: {
    marginVertical: 10,
  },
  qwordsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  qwordsDetailKey: {
    color: '#23242a',
    fontSize: 15,
    fontWeight: 'normal',
  },
  qwordsDetailValue: {
    color: '#23242a',
    fontSize: 15,
    fontWeight: 'bold',
  },
  qwordsModalFooter: {
    backgroundColor: '#e6e6e6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  qwordsFooterText: {
    color: '#23242a',
    fontSize: 11,
    textAlign: 'center',
  },
  qwordsModalCloseButton: {
    backgroundColor: '#999',
    paddingVertical: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
  },
  qwordsModalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  billItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  billInfo: {
    flex: 1,
  },
  billAmount: {
    color: '#fd7e14',
    fontWeight: 'bold',
    fontSize: 16,
  },
  billTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  billLabel: {
    color: '#666',
    fontSize: 14,
  },
  billStatus: {
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 5,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomNavFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
});

export default NotificationScreen;
