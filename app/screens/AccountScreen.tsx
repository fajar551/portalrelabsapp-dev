import React, {useEffect, useState} from 'react';
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getClientProfile} from '../../src/services/api';
import LogoutConfirmModal from '../components/LogoutConfirmModal';

const AccountScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  const [clientData, setClientData] = useState<any>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchProfile = async () => {
    try {
      const profileData = await getClientProfile();
      setClientData(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat akun');
      console.error('Error loading akun:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setError('');
    await fetchProfile();
  };

  if (error) {
    // Cek apakah error terkait dengan token atau autentikasi
    const isAuthError =
      error.includes('Token tidak ditemukan') ||
      error.includes('Gagal mengambil data akun') ||
      error.includes('token expired') ||
      error.includes('token invalid') ||
      error.includes('unauthorized') ||
      error.includes('Unauthorized') ||
      error.includes('Silakan login kembali') ||
      error.includes('Token tidak valid') ||
      error.includes('kadaluarsa');

    return (
      <View style={[styles.root, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            // Jika error terkait autentikasi, arahkan ke halaman login
            if (isAuthError) {
              // Panggil fungsi onLogout untuk melakukan proses logout yang lengkap
              onLogout();
            } else {
              // Jika bukan error autentikasi, coba lagi seperti biasa
              setError('');
              fetchProfile();
            }
          }}>
          <Text style={styles.retryButtonText}>
            {isAuthError ? 'Kembali ke Login' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#2e7ce4" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        // colors={['#ffb347', '#fd7e14']}
        colors={['#E4571B', '#F26522']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <Text style={styles.headerTitle}>Akun</Text>
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, {paddingBottom: 80 + insets.bottom}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // colors={['#fd7e14', '#0033a0']}
            colors={['#F26522', '#E4571B']}
            tintColor="#fd7e14"
          />
        }>
        {/* Profile Section */}
        {/* <View style={styles.profileSection}>
          <Text style={styles.profileTitle}>Profile</Text>
        </View> */}

        {/* Main Profile */}
        <LinearGradient
          colors={['#F26522', '#E4571B']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.mainProfile}>
          <View style={styles.profileInfo}>
            {clientData ? (
              <>
                <Text style={styles.userName}>
                  {clientData?.firstname} {clientData?.lastname}
                </Text>
                <Text style={styles.userEmail}>{clientData?.email}</Text>
              </>
            ) : (
              <>
                <View style={styles.skeletonText} />
                <View
                  style={[styles.skeletonText, {width: 150, marginTop: 5}]}
                />
              </>
            )}
          </View>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={require('../assets/usericon.png')}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </LinearGradient>

        {/* First ID */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ID Relabs</Text>
          <View style={styles.infoCard}>
            {clientData ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID Relabs</Text>
                  <Text style={styles.infoValue}>{clientData?.id}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nama</Text>
                  <Text style={styles.infoValue}>
                    {clientData?.firstname} {clientData?.lastname}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{clientData?.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>No. Telepon</Text>
                  <Text style={styles.infoValue}>
                    {clientData?.phonenumber}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.skeletonText,
                    {width: '80%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '60%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '70%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '50%', height: 18, marginBottom: 0},
                  ]}
                />
              </>
            )}
          </View>
        </View>

        {/* Portal Relabs Account */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Akun Portal Relabs</Text>
          <View style={styles.activeAccountBadge}>
            {clientData ? (
              <>
                <View style={styles.activeAccountRow}>
                  <Text style={styles.activeAccountText}>
                    {clientData?.id}{' '}
                  </Text>
                  <Text style={styles.activeAccountText2}>
                    ID Pelanggan Anda
                  </Text>
                </View>
                <View style={styles.checkIcon}>
                  <Text>✓</Text>
                </View>
              </>
            ) : (
              <View style={[styles.skeletonText, {width: '40%', height: 16}]} />
            )}
          </View>
          <View style={styles.infoCard}>
            {clientData ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nama</Text>
                  <Text style={styles.infoValue}>
                    {clientData?.firstname} {clientData?.lastname}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status Akun</Text>
                  <Text style={styles.infoValue}>{clientData?.status}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Perusahaan</Text>
                  <Text style={styles.infoValue}>{clientData?.company}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{clientData?.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alamat</Text>
                  <Text style={styles.infoValue}>
                    {clientData?.address1} {clientData?.city}{' '}
                    {clientData?.postcode}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.skeletonText,
                    {width: '80%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '60%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '70%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '50%', height: 18, marginBottom: 15},
                  ]}
                />
                <View
                  style={[
                    styles.skeletonText,
                    {width: '90%', height: 18, marginBottom: 0},
                  ]}
                />
              </>
            )}
          </View>
        </View>

        {/* Tambahkan Tombol Logout di bawah sebagai elemen terakhir ScrollView */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}>
            <Text style={styles.logoutButtonText}>Keluar</Text>
          </TouchableOpacity>
        </View>
        <View style={{height: 100 + insets.bottom}} />
      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          styles.bottomNavFixed,
          {paddingBottom: insets.bottom},
        ]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Home')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="home" size={24} color="#fff" />
          </View>
          <Text style={styles.navTextInactive}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="receipt" size={24} color="#fff" />
          </View>
          <Text style={styles.navTextInactive}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Help')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="help" size={24} color="#fff" />
          </View>
          <Text style={styles.navTextInactive}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainerActive}>
            <Icon2 name="person" size={25} color="#F26522" />
          </View>
          <Text style={styles.navTextActive}>Akun</Text>
        </TouchableOpacity>
      </View>

      <LogoutConfirmModal
        visible={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          onLogout();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f9ff',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#f0f0f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // settingsButton: {
  //   width: 40,
  //   height: 40,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  settingsIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fd7e14',
    padding: 15,
  },
  profileTitle: {
    color: '#f0f0f0',
    fontSize: 16,
  },
  mainProfile: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 1,
    marginTop: 35,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: 'white',
    fontSize: 14,
  },
  profileImageContainer: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    marginTop: 25,
  },
  profileImageWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 50,
    tintColor: '#fd7e14',
  },
  sectionContainer: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#22325a',
    fontWeight: '600',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 15,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  activeAccountBadge: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  activeAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeAccountText: {
    color: '#fd7e14',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeAccountText2: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
  checkIcon: {
    backgroundColor: '#f0a838',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#F26522',
    paddingTop: 1,
    borderTopWidth: 1,
    borderTopColor: '#E4571B',
    overflow: 'visible',
  },
  bottomNavFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  navIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fd7e14',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 2,
  },
  navIconContainerInactive: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Changed to transparent
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation: 3,
    marginBottom: 2,
  },
  navIconContainerActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 5,
    marginTop: -25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navText: {
    fontSize: 9,
    color: '#666',
  },
  navTextInactive: {
    fontSize: 9,
    color: '#fff',
  },
  navTextActive: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  activeNavText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#F26522',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutContainer: {
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutButton: {
    backgroundColor: '#F26522',
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
  personIcon: {
    width: 24,
    height: 24,
    marginTop: 7.5,
    borderRadius: 12,
    backgroundColor: '#fd7e14',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 3,
  },
  iconImage: {
    width: 14,
    height: 14,
    tintColor: 'white',
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    height: 15,
    borderRadius: 5,
  },
});

export default AccountScreen;
