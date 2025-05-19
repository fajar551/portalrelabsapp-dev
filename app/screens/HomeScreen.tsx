import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import {getUserData} from '../../src/services/api';
import {getClientInvoices, getPaymentHistory} from '../../src/services/api';

// Mendapatkan lebar layar untuk kalkulasi
const {width} = Dimensions.get('window');
const MENU_ITEM_WIDTH = 100; // Lebar setiap menu item
// const PEEK_WIDTH = 35; // Lebar ikon yang terlihat sebagian (peek)

const HomeScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  // const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(true); // State loading khusus untuk billing period
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // State untuk periode jatuh tempo
  const [billingPeriod, setBillingPeriod] = useState({
    startDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 14 days from now
    amount: 0, // Contoh jumlah tagihan
  });
  const [daysLeft, setDaysLeft] = useState(0);
  const [_progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Data payment history dengan prefix _ untuk menandai tidak digunakan aktif
  const [_paymentHistory, _setPaymentHistory] = useState<
    Array<{
      id?: number;
      invoicenum?: string;
      month: string;
      year: number;
      amount: number;
      status: string;
      datepaid?: string;
      paymentmethod?: string;
    }>
  >([]);

  const fetchUserData = async () => {
    try {
      console.log('Memulai fetch user data...');
      // Coba ambil data dari AsyncStorage terlebih dahulu
      const storedUserData = await AsyncStorage.getItem('userData');

      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
        console.log('User data loaded from AsyncStorage');
      } else {
        console.log('No user data found in AsyncStorage');
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      throw err; // Re-throw error untuk ditangkap di fungsi pemanggil
    }
  };

  // Fungsi untuk mengambil data invoice
  const fetchInvoiceData = async () => {
    setError('');
    setIsBillingLoading(true); // Set loading billing period saat mulai fetch
    try {
      console.log('Memulai fetch invoice data...');

      // Mengambil data invoice untuk billing period sesuai implementasi PayScreen
      const invoices = await getClientInvoices();
      console.log('Data invoices diterima:', invoices?.length || 0);

      // Filter untuk mendapatkan invoice yang belum dibayar (Unpaid)
      const unpaidInvoices = invoices.filter(
        (invoice: any) =>
          invoice.status === 'Unpaid' || invoice.status === 'Belum Dibayar',
      );
      console.log('Unpaid invoices:', unpaidInvoices?.length || 0);

      // Get most recent unpaid invoice
      if (unpaidInvoices && unpaidInvoices.length > 0) {
        const latestUnpaidInvoice = unpaidInvoices[0]; // Ambil yang paling baru
        console.log(
          'Latest unpaid invoice:',
          latestUnpaidInvoice?.id || 'no-id',
        );

        // Extract date and duedate from the invoice
        if (latestUnpaidInvoice.date && latestUnpaidInvoice.duedate) {
          console.log(
            'Setting billing period dengan total:',
            latestUnpaidInvoice.total,
          );
          setBillingPeriod({
            startDate: new Date(latestUnpaidInvoice.date),
            dueDate: new Date(latestUnpaidInvoice.duedate),
            amount: latestUnpaidInvoice.total || 0,
          });
        }
      } else if (invoices && invoices.length > 0) {
        // Jika tidak ada unpaid invoice, gunakan invoice paling baru sebagai fallback
        // tetapi tandai bahwa tidak ada yang perlu dibayar
        const latestInvoice = invoices[0];
        console.log('No unpaid invoice, using latest invoice as fallback');

        if (latestInvoice.date && latestInvoice.duedate) {
          setBillingPeriod({
            startDate: new Date(latestInvoice.date),
            dueDate: new Date(latestInvoice.duedate),
            amount: 0, // Tandai tidak ada yang perlu dibayar
          });
        }
      } else {
        // Tidak ada invoice sama sekali
        console.log('No invoices at all, setting default billing period');
        setBillingPeriod({
          startDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          amount: 0,
        });
      }

      // Mengambil data riwayat pembayaran
      const payments = await getPaymentHistory();
      if (payments && payments.length > 0) {
        _setPaymentHistory(payments);
      } else {
        // Jangan gunakan fallback data, biarkan array kosong
        _setPaymentHistory([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
      // Jika error, set billing amount ke 0 untuk menunjukkan tidak ada tagihan
      setBillingPeriod(prev => ({...prev, amount: 0}));
      throw err; // Re-throw error untuk ditangkap di fungsi pemanggil
    } finally {
      setIsBillingLoading(false); // Selesai loading billing period
    }
  };

  useEffect(() => {
    // Fungsi untuk menangani fetch data saat pertama kali komponen load
    const fetchInitialData = async () => {
      setIsLoading(true);
      setIsBillingLoading(true); // Set loading billing period
      try {
        await fetchUserData();
        await fetchInvoiceData();
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      } finally {
        setIsLoading(false);
        setIsBillingLoading(false); // Selesai loading billing period
      }
    };

    fetchInitialData();
  }, []);

  // Format tanggal untuk tampilan
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('id-ID', {month: 'short'});
    return {day, month};
  };

  // Fungsi untuk memformat angka ke dalam format Rupiah
  const formatRupiah = (amount: number) => {
    // Gunakan NumberFormat dari Intl untuk format yang benar sesuai standar Indonesia
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Menghitung hari tersisa dan progress
  useEffect(() => {
    const calculateProgress = () => {
      const today = new Date();

      // Total hari dalam periode (menambahkan +1 untuk menghitung hari terakhir)
      const totalDays = Math.floor(
        (billingPeriod.dueDate.getTime() - billingPeriod.startDate.getTime()) /
          (1000 * 3600 * 24),
      );

      // Hari yang sudah berlalu
      const daysElapsed = Math.floor(
        (today.getTime() - billingPeriod.startDate.getTime()) /
          (1000 * 3600 * 24),
      );

      // Pastikan daysElapsed minimal 0
      const elapsed = Math.max(0, daysElapsed);

      // Hari tersisa
      const left = Math.max(0, totalDays - elapsed);
      setDaysLeft(left);

      // Kalkulasi progres (0-1) - DIUBAH: semakin sedikit hari tersisa, semakin tinggi progress
      // Gunakan rasio hari yang telah berlalu dibanding total hari
      const calculatedProgress = Math.min(1, Math.max(0, elapsed / totalDays));
      setProgress(calculatedProgress);

      // Animasikan progress bar
      Animated.timing(progressAnim, {
        toValue: calculatedProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    };

    calculateProgress();

    // Update progress setiap 6 jam
    const interval = setInterval(calculateProgress, 21600000);
    return () => clearInterval(interval);
  }, [progressAnim, billingPeriod]);

  // Fungsi untuk menentukan warna progress bar berdasarkan progress
  const getProgressBarColor = () => {
    if (_progress < 0.7) {
      return '#4CD964'; // Hijau untuk progress rendah (masih banyak waktu)
    } else if (_progress < 0.9) {
      return '#FFCC00'; // Kuning untuk progress sedang
    } else {
      return '#FF3B30'; // Merah untuk progress tinggi (waktu hampir habis)
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setIsLoading(true); // Tambahkan loading state
    setIsBillingLoading(true); // Set loading billing period

    try {
      // Panggil keduanya secara berurutan, pastikan invoice data diambil baru
      await fetchUserData();
      await fetchInvoiceData();

      // Log untuk debugging
      console.log('Refresh selesai, billingPeriod:', billingPeriod);
    } catch (err: any) {
      console.error('Error saat refresh:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
      setIsBillingLoading(false); // Selesai loading billing period
      setRefreshing(false);
    }
  };

  // Handle "Bayar Sekarang" button press
  const handlePayNow = () => {
    // Langsung navigasi ke halaman Pay
    navigateTo('Pay');
  };

  // Tambahkan state untuk carousel index
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // Data promo
  const promoItems = [
    {
      title: 'Enjoy Your',
      subtitle: 'First Privilege',
      tag: 'Voucher',
    },
    {
      title: 'Special Offer',
      subtitle: 'New Customer',
      tag: '50% Off',
    },
    {
      title: 'Weekend Deal',
      subtitle: 'Limited Time',
      tag: 'Promo',
    },
    {
      title: 'Member Benefits',
      subtitle: 'Premium Access',
      tag: 'Exclusive',
    },
  ];

  // Tambahkan fungsi handle scroll untuk promo carousel
  const handlePromoScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    // Simpan kalkulasi yang sama tapi dalam bentuk yang lebih stabil
    const cardWidth = width - 110; // Sesuaikan dengan width - 120 + 10
    const index = Math.round(scrollX / cardWidth);
    const safeIndex = Math.min(Math.max(0, index), promoItems.length - 1);
    setActivePromoIndex(safeIndex);
  };

  // Jika terjadi error, tampilkan pesan dan tombol retry
  if (error) {
    // Cek apakah error terkait dengan token atau autentikasi
    const isAuthError =
      error.includes('Token tidak ditemukan') ||
      error.includes('Gagal mengambil data') ||
      error.includes('token expired') ||
      error.includes('token invalid') ||
      error.includes('unauthorized') ||
      error.includes('Unauthorized') ||
      error.includes('Silakan login kembali') ||
      error.includes('Token tidak valid') ||
      error.includes('kadaluarsa');

    return (
      <SafeAreaView style={[styles.root, styles.centerContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            if (isAuthError) {
              // Jika error terkait autentikasi, jalankan fungsi logout
              onLogout();
            } else {
              // Jika bukan error autentikasi, coba muat ulang data
              fetchInvoiceData();
            }
          }}>
          <Text style={styles.retryButtonText}>
            {isAuthError ? 'Kembali ke Login' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#fd7e14" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
          <TouchableOpacity style={styles.notifIcon}>
            <Text style={styles.notifText}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifIcon2} onPress={onLogout}>
            {/* <Text style={styles.notifText2}>⇨</Text> */}
            <Image
              source={require('../assets/logoutt.png')}
              style={styles.logoutImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fd7e14', '#0033a0']}
            tintColor="#fd7e14"
          />
        }>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fd7e14" />
              <Text style={styles.loadingText}>Memuat data pengguna...</Text>
            </View>
          ) : (
            <>
              <View style={styles.profileInfo}>
                <Text style={styles.helloText}>Hello,</Text>
                <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                <Text style={styles.userEmail}>
                  ✉️ {userData?.email || 'Loading...'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Account Info Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountLabel}>No. Akun</Text>
            <Text style={styles.accountValue}>{userData?.id || '-'}</Text>
          </View>
          <View style={styles.accountInfoDivider} />
          <View style={styles.accountInfoItem}>
            {/* <Text style={styles.accountLabel}>Billing Status</Text> */}
            <Text style={styles.accountLabel}>Status Klien</Text>
            <Text style={styles.blueText}>{userData?.status || '-'}</Text>
          </View>
        </View>

        {/* For You Section */}
        <View style={styles.forYouSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ For You</Text>
          </View>

          {/* Promo Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handlePromoScroll}
            scrollEventThrottle={16}
            decelerationRate={0.9}
            snapToInterval={width - 40}
            snapToAlignment="start"
            contentOffset={{x: 0, y: 0}}
            contentContainerStyle={styles.promoScrollContent}>
            {promoItems.map((promo, index) => (
              <View
                key={index}
                style={[
                  styles.promoCard,
                  index > 0 ? styles.promoCardMargin : undefined,
                ]}>
                <View style={styles.promoLogoContainer}>
                  <Image
                    source={require('../assets/guarantee.webp')}
                    style={styles.promoLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                  <View style={styles.voucherTag}>
                    <Text style={styles.voucherText}>{promo.tag}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handlePromoScroll}
            scrollEventThrottle={16}
            decelerationRate={0.9}
            snapToInterval={width - 40}
            snapToAlignment="start"
            contentOffset={{x: 0, y: 0}}
            contentContainerStyle={styles.promoScrollContent}>
            {promoItems.map((promo, index) => (
              <View
                key={index}
                style={[
                  styles.promoCard2,
                  index > 0 ? styles.promoCardMargin : undefined,
                ]}>
                <View style={styles.promoLogoContainer}>
                  <Image
                    source={require('../assets/guarantee.webp')}
                    style={styles.promoLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                  <View style={styles.voucherTag}>
                    <Text style={styles.voucherText}>{promo.tag}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView> */}

          {/* Carousel Indicators */}
          <View style={styles.carouselIndicator}>
            {promoItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.carouselDot,
                  activePromoIndex === index && styles.carouselActiveDot,
                ]}
              />
            ))}
          </View>

          {/* Offers Section */}
          <View style={styles.offersSection}>
            <View style={styles.offerHeader}>
              <Text style={styles.offersTitle}>Informasi Tagihan Anda 💫</Text>
              <Text style={styles.offersSubtitle}>
                Silahkan cek informasi tagihan Anda ...
              </Text>
            </View>
          </View>
        </View>

        {/* Periode Jatuh Tempo - Disalin dari PayScreen */}
        {isBillingLoading ? (
          <View style={styles.dueCardContainer}>
            <View style={styles.dueCard}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fd7e14" />
                <Text style={styles.loadingText}>Memuat data tagihan...</Text>
              </View>
            </View>
          </View>
        ) : billingPeriod.amount > 0 ? (
          <View style={styles.dueCardContainer}>
            <View style={styles.dueCard}>
              <View style={styles.dueCardHeader}>
                <Text style={styles.dueCardTitle}>Periode Jatuh Tempo</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total Tagihan</Text>
                  <Text style={styles.amountValue}>
                    {formatRupiah(billingPeriod.amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.periodProgressContainer}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateValue}>
                    {formatDate(billingPeriod.startDate).day}
                  </Text>
                  <Text style={styles.dateMonth}>
                    {formatDate(billingPeriod.startDate).month}
                  </Text>
                </View>

                <View style={styles.progressBarWrapper}>
                  {/* progressBar Anima */}
                  {/* <View style={styles.progressBarContainer}>
                    <Animated.View
                      style={[
                        styles.progressBar,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                          backgroundColor: getProgressBarColor(),
                        },
                      ]}
                    />
                  </View> */}

                  <View style={styles.progressLineContainer}>
                    <View style={styles.progressLineBg}>
                      <Animated.View
                        style={[
                          styles.progressLine,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: getProgressBarColor(),
                          },
                        ]}
                      />
                    </View>
                    <Animated.View
                      style={[
                        styles.progressDot,
                        {
                          left: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                          transform: [{translateX: -4}], // Menggeser dot agar berada di tengah progress bar
                          backgroundColor: getProgressBarColor(),
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.progressText}>
                    {daysLeft} Hari Tersisa
                  </Text>
                </View>

                <View style={styles.dateColumn}>
                  <Text style={styles.dateValue}>
                    {formatDate(billingPeriod.dueDate).day}
                  </Text>
                  <Text style={styles.dateMonth}>
                    {formatDate(billingPeriod.dueDate).month}
                  </Text>
                </View>
              </View>

              <View style={styles.dueCardFooter}>
                <TouchableOpacity
                  style={styles.duePayButton}
                  onPress={handlePayNow}>
                  <Text style={styles.duePayButtonText}>Bayar Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noBillingContainer}>
            <Text style={styles.noBillingText}>
              Anda belum mempunyai tagihan
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNav]}>🏠</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('PaymentSuccess')}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navText}>Buy</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
          <Text style={styles.navIcon}>💳</Text>
          <Text style={styles.navText}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <View style={styles.personIcon}>
            <Image
              source={require('../assets/user.png')}
              style={styles.iconImage}
            />
          </View>
          <Text style={[styles.navText]}>Akun</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  blueText: {
    zIndex: 1000,
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fd7e14',
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIconsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
  menuIconsContent: {
    paddingVertical: 10,
    paddingRight: 35,
  },
  logoutImage: {
    width: 24,
    height: 24,
    marginTop: 17,
  },
  personIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fd7e14',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7.5,
  },
  iconImage: {
    width: 14,
    height: 14,
    tintColor: 'white',
  },
  menuItem: {
    alignItems: 'center',
    width: MENU_ITEM_WIDTH,
    marginRight: 0,
  },
  // Style untuk indikator dot
  scrollIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ffb444',
  },
  logoContainer: {
    height: 40,
  },
  logo: {
    height: 40,
    width: 80,
    marginLeft: -17,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 10,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4cd964',
    marginRight: 5,
  },
  onlineText: {
    color: 'white',
    fontSize: 12,
  },
  notifIcon: {
    width: 34,
    height: 34,
    marginTop: -1,
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIcon2: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -17,
    fontWeight: 'bold',
  },
  notifText: {
    fontSize: 18,
    color: 'white',
    marginRight: -15,
  },
  notifText2: {
    fontSize: 30,
    color: 'white',
    marginRight: -15,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fd7e14',
    paddingHorizontal: 16,
    paddingBottom: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 2,
  },
  helloText: {
    color: 'white',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 3,
  },
  userEmail: {
    color: 'white',
    fontSize: 12,
  },
  accountCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -25,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  accountInfoItem: {
    flex: 1,
  },
  accountLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 5,
  },
  accountValue: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountInfoDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 15,
  },
  menuIconBlue: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#fd7e14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  menuIconWhite: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconTextWhite: {
    color: '#fff',
  },
  iconTextOrange: {
    color: '#fd7e14',
  },
  menuText: {
    fontSize: 11,
    textAlign: 'center',
    color: '#999',
  },
  forYouSection: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  promoScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  promoCard: {
    width: width - 120,
    // backgroundColor: 'red',
    backgroundColor: '#fd7e14',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCard2: {
    width: width - 120,
    // backgroundColor: 'red',
    backgroundColor: '#fd7e14',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCardMargin: {
    marginLeft: 10,
  },
  promoLogoContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  promoLogo: {
    width: 80,
    height: 80,
  },
  promoContent: {
    flex: 1,
    alignItems: 'center',
  },
  promoTitle: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  promoSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  voucherTag: {
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 5,
  },
  voucherText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  offersSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginLeft: -16,
    marginRight: -16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    paddingVertical: 15,
  },
  offerHeader: {
    flex: 1,
  },
  offerArrow: {
    textAlign: 'right',
    marginRight: 0,
  },
  offersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#999',
  },
  offersSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  voucherCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginLeft: -16,
    marginRight: -10,
    width: width,
  },
  voucherCardLarge: {
    width: '48%',
    backgroundColor: '#fd7e14',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffb444',
    borderStyle: 'dotted',
    marginRight: 10,
    marginLeft: 45,
  },
  voucherCardSmall: {
    width: '30%',
    backgroundColor: '#fd7e14',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffb444',
    borderStyle: 'dotted',
    marginRight: 50,
  },
  voucherContent: {
    padding: 12,
  },
  voucherHeader: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  voucherName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  discount: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15,
  },
  discountText: {
    color: '#fd7e14',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
    color: '#666',
  },
  navText: {
    fontSize: 10,
    color: '#666',
  },
  activeNav: {
    color: '#fd7e14',
  },
  activeNavText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  carouselIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  carouselActiveDot: {
    backgroundColor: '#ffb444',
    width: 20, // Dot yang aktif lebih panjang
    borderRadius: 4,
  },
  carouselContainer: {
    paddingHorizontal: 10, // Padding untuk seluruh container
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 120,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 10,
  },
  // Styles untuk Periode Jatuh Tempo (disalin dari PayScreen)
  dueCardContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    // marginTop: 15,
  },
  dueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dueCardHeader: {
    marginBottom: 20,
  },
  dueCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  amountContainer: {
    marginTop: 5,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fd7e14',
  },
  periodProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateColumn: {
    alignItems: 'center',
  },
  dateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateMonth: {
    fontSize: 14,
    color: '#666',
  },
  progressBarWrapper: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  dueCardFooter: {
    alignItems: 'center',
  },
  duePayButton: {
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  duePayButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressLineContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
    position: 'relative',
  },
  progressLineBg: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressLine: {
    height: 2,
    borderRadius: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#fd7e14',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noBillingContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noBillingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fd7e14',
    textAlign: 'center',
  },
});

export default HomeScreen;
