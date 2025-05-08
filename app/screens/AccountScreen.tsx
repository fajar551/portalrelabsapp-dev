import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Mendapatkan lebar layar untuk kalkulasi
const {width} = Dimensions.get('window');

const AccountScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#2e7ce4" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Text style={styles.profileTitle}>Profile</Text>
        </View>

        {/* Main Profile */}
        <View style={styles.mainProfile}>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Fajar Habib Zaelani</Text>
            <Text style={styles.userEmail}>fajarhabibzaelani@gmail.com</Text>
          </View>
          <View style={styles.qrContainer}>
            <View style={styles.qrCode}>
              {/* <Text style={{fontSize: 10, textAlign: 'center'}}>
                QR{'\n'}CODE
              </Text> */}
              {/* <Image
                    source={require('../assets/qr-placeholder.png')}
                  /> */}
            </View>
          </View>
        </View>

        {/* First ID */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>First ID</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue}>fajarhabibzaelani@gmail.com</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>FAJAR HABIB ZAELANI</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mobile No.</Text>
              <Text style={styles.infoValue}>082130697168</Text>
            </View>
          </View>
        </View>

        {/* Firstmedia Account */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Firstmedia Account</Text>
          <View style={styles.activeAccountBadge}>
            <Text style={styles.activeAccountText}>11946253 in use</Text>
            <View style={styles.checkIcon}>
              <Text>✓</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account No.</Text>
              <Text style={styles.infoValue}>11946253</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>FAJAR HABIB ZAELANI</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                MAJALAYA BLOK A NO. 2 MAJALAYA KAB. BANDUNG 40383
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue}>fajarhabibzaelani@gmail.com</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
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
        {/* <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🎫</Text>
          <Text style={styles.navText}>My Voucher</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.navItem} onPress={onLogout}>
          <Text style={[styles.navIcon, styles.activeNav]}>👤</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Account</Text>
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
  header: {
    backgroundColor: '#0033a0',
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
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#0033a0',
    padding: 15,
  },
  profileTitle: {
    color: '#f0f0f0',
    fontSize: 16,
  },
  mainProfile: {
    backgroundColor: '#0033a0',
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 1,
    marginTop: 10,
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
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  qrCode: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    width: width - 30,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
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
    width: width - 30,
  },
  activeAccountText: {
    color: '#fd7e14',
    fontWeight: 'bold',
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
});

export default AccountScreen;
