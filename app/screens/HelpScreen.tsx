import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getTicketsByUserId} from '../../src/services/api';

const HelpScreen = ({
  navigateTo,
}: {
  navigateTo: (screen: string, params?: any) => void;
}) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);

  // State untuk tiket
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorTickets, setErrorTickets] = useState('');
  const [scrollingToTickets, setScrollingToTickets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const departments = [
    {
      id: '1',
      title: 'Technical Support',
      subtitle: '',
      icon: {name: 'support-agent', type: 'MaterialIcons'},
    },
    {
      id: '2',
      title: 'Billing Support',
      subtitle: '',
      icon: {name: 'receipt', type: 'MaterialIcons'},
    },
    {
      id: '3',
      title: 'Finance & Tax',
      subtitle: 'Faktur Pajak & Bukti Potong',
      icon: {name: 'attach-money', type: 'MaterialIcons'},
    },
  ];

  const handleDepartmentPress = (deptId: string) => {
    navigateTo('OpenTicket', {departmentId: deptId});
  };

  const fetchTickets = async () => {
    try {
      setRefreshing(true);
      setLoadingTickets(true);
      setErrorTickets('');
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        setErrorTickets('User belum login');
        setLoadingTickets(false);
        setRefreshing(false);
        return;
      }
      const userData = JSON.parse(userDataStr);
      const userId = userData.id;
      const data = await getTicketsByUserId(userId);
      const arr = Array.isArray(data?.data) ? data.data : [];
      setTickets(arr);
    } catch (err: any) {
      setErrorTickets(err.message || 'Gagal memuat tiket');
    } finally {
      setLoadingTickets(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Fungsi untuk scroll ke daftar tiket
  const scrollToTickets = () => {
    setScrollingToTickets(true);
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({y: 600, animated: true});
      }
      setTimeout(() => setScrollingToTickets(false), 500); // spinner hilang setelah scroll
    }, 100);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#E4571B', '#F26522']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Bantuan</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, {paddingBottom: 80 + insets.bottom}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTickets}
            colors={['#F26522']}
            tintColor="#F26522"
          />
        }>
        <View style={styles.topCardContainer}>
          <View style={styles.topCard}>
            <Text style={styles.topCardTitle}>Buat Tiket Baru</Text>
            <View style={styles.illustrationContainer}>
              <Image
                source={{
                  uri: 'https://portal.relabs.id/mobile/img/helps.png',
                }}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.topCardSubtitle2}>
              Jika Anda tidak dapat menemukan solusi untuk masalah Anda, Anda
              dapat mengajukan tiket dengan memilih departemen yang sesuai di
              bawah ini.
            </Text>
          </View>
        </View>
        {/* Tombol Lihat Daftar Ticket Anda */}
        {(tickets.length > 0 || loadingTickets) && (
          <TouchableOpacity
            style={styles.seeTicketsBtn}
            onPress={scrollToTickets}
            activeOpacity={0.7}
            disabled={scrollingToTickets || loadingTickets}>
            <Text style={styles.seeTicketsText}>
              {loadingTickets ? 'Loading ...' : 'Lihat Daftar Ticket Anda'}
            </Text>
            {loadingTickets ? (
              <ActivityIndicator
                size="small"
                color="#F26522"
                style={{marginLeft: 6}}
              />
            ) : scrollingToTickets ? (
              <ActivityIndicator
                size="small"
                color="#F26522"
                style={{marginLeft: 6}}
              />
            ) : (
              <Icon name="expand-more" size={22} color="#F26522" />
            )}
          </TouchableOpacity>
        )}
        {/* Department List di luar card */}
        <View style={styles.departmentList}>
          <Text style={styles.settingTitle}>Pilih Departemen</Text>
          {departments.map((dept, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.settingMenuCard}
              activeOpacity={0.7}
              onPress={() => handleDepartmentPress(dept.id)}>
              <View style={styles.settingIconWrap}>
                {dept.icon.type === 'MaterialIcons' ? (
                  <Icon name={dept.icon.name} size={26} color="#F26522" />
                ) : (
                  <Icon2 name={dept.icon.name} size={26} color="#F26522" />
                )}
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingMenuText}>{dept.title}</Text>
                {!!dept.subtitle && (
                  <Text style={styles.settingMenuSubtitle}>
                    {dept.subtitle}
                  </Text>
                )}
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color="#F26522"
                style={styles.settingChevronIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
        {/* List Ticket */}
        <View style={styles.ticketSection}>
          <Text style={styles.ticketTitle}>Daftar Tiket Anda</Text>
          {loadingTickets ? (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketLoading}>Memuat tiket...</Text>
            </View>
          ) : errorTickets ? (
            <Text style={styles.ticketError}>{errorTickets}</Text>
          ) : tickets.length === 0 ? (
            <View style={styles.ticketCard}>
              <Text style={styles.ticketEmpty}>Belum ada tiket.</Text>
            </View>
          ) : (
            tickets.map((ticket, idx) => (
              <View key={idx} style={styles.ticketCard}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <View style={{flex: 1}}>
                    <Text style={styles.ticketCardTitle}>
                      {ticket.title || ticket.subject || 'Tiket'}
                    </Text>
                    <Text style={styles.ticketCardStatus}>
                      Status: {ticket.status}
                    </Text>
                    <Text style={styles.ticketCardDate}>
                      Tanggal: {ticket.date || ticket.created_at || '-'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigateTo('TicketDetail', {tid: ticket.id})
                    }
                    style={{padding: 6}}>
                    <Icon name="chevron-right" size={26} color="#F26522" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{height: 100 + insets.bottom}} />
      </ScrollView>

      {/* Bottom Navigation */}
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
            <Icon name="home" size={24} color="#666" />
          </View>
          <Text style={styles.navText}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="receipt" size={24} color="#666" />
          </View>
          <Text style={styles.navText}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <LinearGradient
            colors={['#E4571B', '#F26522']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.navIconContainer}>
            <Icon name="help" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.navText, styles.activeNavText]}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <View style={styles.navIconContainerInactive}>
            <Icon2 name="person" size={24} color="#666" />
          </View>
          <Text style={styles.navText}>Akun</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f9ff',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  topCardContainer: {
    padding: 16,
  },
  topCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    marginTop: 4,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  illustrationImage: {
    width: 120,
    height: 120,
    marginBottom: 10,
    alignSelf: 'center',
  },
  content: {
    padding: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  helpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 5,
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
  navItem: {
    flex: 1,
    alignItems: 'center',
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
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    marginBottom: 2,
  },
  navText: {
    fontSize: 9,
    color: '#666',
  },
  activeNavText: {
    color: '#F26522',
    fontWeight: 'bold',
  },
  topCardSubtitle2: {
    fontSize: 14,
    color: '#22325a',
    fontWeight: '400',
    textAlign: 'justify',
    marginTop: 5,
    marginBottom: 8,
    lineHeight: 22,
  },
  departmentList: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22325a',
    marginLeft: 8,
    marginBottom: 10,
    marginTop: 5,
  },
  settingMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff4ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  settingTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  settingMenuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 2,
  },
  settingMenuSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  settingChevronIcon: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  ticketSection: {
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 18,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 12,
  },
  ticketLoading: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ticketError: {
    color: 'red',
    marginBottom: 8,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 4,
  },
  ticketCardStatus: {
    fontSize: 13,
    color: '#F26522',
    marginBottom: 2,
  },
  ticketCardDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  ticketEmpty: {
    fontWeight: '500',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  seeTicketsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seeTicketsText: {
    color: '#22325a',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 6,
  },
});

export default HelpScreen;
