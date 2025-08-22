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
        {/* <Text style={styles.headerTitle}>Akun</Text> */}
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
          {/* Profile Title */}
          <View style={styles.profileTitleContainer}>
            <Text style={styles.profileTitleText}>Profile</Text>
          </View>

          {/* Profile Content */}
          <View style={styles.profileContent}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageWrapper}>
                <Image
                  source={require('../assets/usericon.png')}
                  style={styles.profileImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <View style={styles.profileInfo}>
              {clientData ? (
                <Text style={styles.userName}>
                  {clientData?.firstname} {clientData?.lastname}
                </Text>
              ) : (
                <View style={styles.skeletonText} />
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Contact Information Section */}
        <View style={styles.contactSection}>
          {/* ID Relabs Section */}
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Icon name="badge" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>ID Relabs</Text>
              {clientData ? (
                <Text style={styles.contactValue}>
                  {clientData?.id || 'Tidak ada data'}
                </Text>
              ) : (
                <View
                  style={[styles.contactSkeletonText, {width: 120, height: 14}]}
                />
              )}
            </View>
          </View>
          {/* Email Section */}
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Icon name="email" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email</Text>
              {clientData ? (
                <>
                  <Text style={styles.contactLabel}>Official</Text>
                  <Text style={styles.contactValue}>{clientData?.email}</Text>
                  <Text style={styles.contactLabel}>Personal</Text>
                  <Text style={styles.contactValue}>{clientData?.email}</Text>
                </>
              ) : (
                <>
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 60, height: 12, marginBottom: 5},
                    ]}
                  />
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 200, height: 14, marginBottom: 10},
                    ]}
                  />
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 60, height: 12, marginBottom: 5},
                    ]}
                  />
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 200, height: 14},
                    ]}
                  />
                </>
              )}
            </View>
          </View>

          {/* Phone Section */}
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Icon name="phone" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Nomor Telepon</Text>
              {clientData ? (
                <>
                  <Text style={styles.contactLabel}>Mobile</Text>
                  <Text style={styles.contactValue}>
                    {clientData?.phonenumber}
                  </Text>
                </>
              ) : (
                <>
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 60, height: 12, marginBottom: 5},
                    ]}
                  />
                  <View
                    style={[
                      styles.contactSkeletonText,
                      {width: 150, height: 14},
                    ]}
                  />
                </>
              )}
            </View>
          </View>

          {/* Company Section */}
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Icon name="business" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Perusahaan</Text>
              {clientData ? (
                <Text style={styles.contactValue}>
                  {clientData?.company || 'Tidak ada data'}
                </Text>
              ) : (
                <View
                  style={[styles.contactSkeletonText, {width: 120, height: 14}]}
                />
              )}
            </View>
          </View>

          {/* Status Section */}
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Icon name="person" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Status Akun</Text>
              {clientData ? (
                <Text style={styles.contactValue}>
                  {clientData?.status || 'Tidak ada data'}
                </Text>
              ) : (
                <View
                  style={[styles.contactSkeletonText, {width: 100, height: 14}]}
                />
              )}
            </View>
          </View>

          {/* Address Section */}
          <View
            style={[
              styles.contactItem,
              {borderBottomWidth: 0, marginBottom: 0},
            ]}>
            <View style={styles.contactIconContainer}>
              <Icon name="location-on" size={20} color="#F26522" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Alamat</Text>
              {clientData ? (
                <Text style={styles.contactValue}>
                  {clientData?.address1} {clientData?.city}{' '}
                  {clientData?.postcode}
                </Text>
              ) : (
                <View
                  style={[styles.contactSkeletonText, {width: 200, height: 14}]}
                />
              )}
            </View>
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
            <Icon name="home" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="receipt" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Help')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="help" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainerActive}>
            <Icon2 name="person" size={25} color="#fff" />
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
  scrollView: {
    flex: 1,
  },
  mainProfile: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'column',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  profileTitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileTitleText: {
    color: '#f0f0f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileImageContainer: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    marginBottom: 10,
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
  navIconContainerInactive: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 2,
  },
  navIconContainerActive: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F26522',
    marginBottom: 5,
    marginTop: -25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  navTextInactive: {
    fontSize: 9,
    color: '#F26522',
  },
  navTextActive: {
    fontSize: 10,
    color: '#F26522',
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
  skeletonText: {
    backgroundColor: '#444',
    height: 15,
    borderRadius: 5,
    width: 120,
  },
  contactSection: {
    marginTop: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    color: '#22325a',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#fd7e14',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  contactSkeletonText: {
    backgroundColor: '#e0e0e0',
    height: 15,
    borderRadius: 5,
  },
});

export default AccountScreen;
