import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// import {getUserData} from '../../src/services/api';

// Mendapatkan lebar layar untuk kalkulasi
const {width} = Dimensions.get('window');
const MENU_ITEM_WIDTH = 100; // Lebar setiap menu item
const PEEK_WIDTH = 35; // Lebar ikon yang terlihat sebagian (peek)

const HomeScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuItems = [
    {icon: '☰', text: 'All Menu', isBlue: true},
    {icon: '🔧', text: 'Trouble shooting'},
    {icon: '💬', text: 'Custom service'},
    {icon: '📋', text: 'Log'},
    {icon: '📱', text: 'Device'},
    {icon: '💰', text: 'Payments'},
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Coba ambil data dari AsyncStorage terlebih dahulu
        const storedUserData = await AsyncStorage.getItem('userData');

        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        } else {
          console.log('No user data found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Menangani scroll pada menu horizontal
  const handleMenuScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;

    // Hitung berdasarkan posisi scroll dibagi dengan lebar satu item
    // Dengan penambahan offset untuk posisi tengah ikon
    const index = Math.round(scrollX / MENU_ITEM_WIDTH);

    // Pastikan index tidak keluar batas
    const safeIndex = Math.min(Math.max(0, index), menuItems.length - 1);
    setActiveMenuIndex(safeIndex);
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
    const cardWidth = width - 120 + 10; // Width disesuaikan dengan lebar card baru + margin
    const index = Math.round(scrollX / cardWidth);
    setActivePromoIndex(Math.min(Math.max(0, index), promoItems.length - 1));
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#2e7ce4" barStyle="light-content" />

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
          <TouchableOpacity style={styles.notifIcon} onPress={onLogout}>
            <Text style={styles.notifText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7ce4" />
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
              <View style={styles.cardPreview}>
                {/* Card Preview */}
                <View style={styles.cardImage}>
                  <Text style={styles.cardText}>💳</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Account Info Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountInfoItem}>
            <Text style={styles.accountLabel}>Account No.</Text>
            <Text style={styles.accountValue}>{userData?.id || '-'}</Text>
          </View>
          <View style={styles.accountInfoDivider} />
          <View style={styles.accountInfoItem}>
            {/* <Text style={styles.accountLabel}>Billing Status</Text> */}
            <Text style={styles.accountLabel}>Client Status</Text>
            <Text style={styles.blueText}>
            {userData?.status || '-'}
            </Text>
          </View>
        </View>

        {/* Menu Icons with Dynamic Indicator */}
        <View style={styles.menuIconsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuIconsContent}
            snapToInterval={MENU_ITEM_WIDTH * 3} // Snap ke 3 item sekaligus
            decelerationRate="fast"
            onScroll={handleMenuScroll}
            scrollEventThrottle={16}
            snapToAlignment="start"
            contentInset={{right: PEEK_WIDTH}} // Memberi ruang di kanan untuk peek
          >
            {menuItems.map((item, index) => (
              <View key={index} style={styles.menuItem}>
                <View
                  style={
                    item.isBlue ? styles.menuIconBlue : styles.menuIconWhite
                  }>
                  <Text
                    style={
                      item.isBlue ? styles.iconTextWhite : styles.iconTextOrange
                    }>
                    {item.icon}
                  </Text>
                </View>
                <Text style={styles.menuText}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Indikator scroll */}
          <View style={styles.scrollIndicator}>
            <View
              style={[
                styles.indicatorDot,
                activeMenuIndex < 3 && styles.activeDot,
              ]}
            />
            <View
              style={[
                styles.indicatorDot,
                activeMenuIndex >= 3 && styles.activeDot,
              ]}
            />
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
            decelerationRate="fast"
            snapToInterval={width - 40} // Sesuaikan snapToInterval
            contentContainerStyle={styles.promoScrollContent}>
            {promoItems.map((promo, index) => (
              <View
                key={index}
                style={[styles.promoCard, index > 0 && styles.promoCardMargin]}>
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
              <Text style={styles.offersTitle}>
                There are attractive offers!
              </Text>
              <Text style={styles.offersSubtitle}>
                Especially for you, don't miss it...
              </Text>
            </View>
            <Text style={styles.offerArrow}>▶</Text>
          </View>

          {/* Voucher Cards */}
          <View style={styles.voucherCardsContainer}>
            <View style={styles.voucherCardLarge}>
              <View style={styles.voucherContent}>
                <Text style={styles.voucherHeader}>Voucher Deals</Text>
                <Text style={styles.voucherName}>Best Entertainment</Text>
                <View style={styles.discount}>
                  <Text style={styles.discountText}>Discount 50%</Text>
                </View>
              </View>
            </View>

            <View style={styles.voucherCardSmall}>
              <View style={styles.voucherContent}>
                <Text style={styles.voucherHeader}>Voucher Deals</Text>
                <Text style={styles.voucherName}>Best Sport</Text>
                <View style={styles.discount}>
                  <Text style={styles.discountText}>Discount 50%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNav]}>🏠</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('PaymentSuccess')}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
          <Text style={styles.navIcon}>💳</Text>
          <Text style={styles.navText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Account</Text>
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
    backgroundColor: '#2e7ce4',
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
    paddingRight: PEEK_WIDTH, // Tambahkan padding kanan agar ada ruang untuk peek
  },
  menuItem: {
    alignItems: 'center',
    width: MENU_ITEM_WIDTH, // Gunakan konstanta yang sudah didefinisikan
    marginRight: 0, // Hapus margin kanan
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
    backgroundColor: '#0033a0',
  },
  logoContainer: {
    height: 30,
  },
  logo: {
    height: 30,
    width: 80,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    fontSize: 18,
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#2e7ce4',
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  cardPreview: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardImage: {
    width: 60,
    height: 40,
    backgroundColor: '#444',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: 'white',
    fontSize: 12,
  },
  accountCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
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
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#0033a0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  menuIconWhite: {
    width: 45,
    height: 45,
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
    color: 'white',
  },
  iconTextOrange: {
    color: '#fd7e14',
  },
  menuText: {
    fontSize: 11,
    textAlign: 'center',
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
  },
  promoScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  promoCard: {
    width: width - 120,
    backgroundColor: '#2e7ce4',
    borderRadius: 10,
    padding: 15,
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
    backgroundColor: '#2e7ce4',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0033a0',
    borderStyle: 'dotted',
    marginRight: 10,
    marginLeft: 45,
  },
  voucherCardSmall: {
    width: '30%',
    backgroundColor: '#2e7ce4',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0033a0',
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
    color: 'red',
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
    color: '#0033a0',
  },
  activeNavText: {
    color: '#0033a0',
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
    backgroundColor: '#0033a0',
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
});

export default HomeScreen;
