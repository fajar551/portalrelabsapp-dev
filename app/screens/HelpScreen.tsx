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
  const [errorTickets, setErrorTickets] = useState('');
  const [scrollingToTickets, setScrollingToTickets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function untuk style dinamis
  const getScrollViewStyle = () => {
    return [styles.scrollView, {paddingBottom: 80 + insets.bottom}];
  };

  const getSpacerStyle = () => {
    return {height: 100 + insets.bottom};
  };

  const getBottomNavStyle = () => {
    return [
      styles.bottomNav,
      styles.bottomNavFixed,
      {paddingBottom: insets.bottom},
    ];
  };

  const getTicketCardRowStyle = () => {
    return {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    };
  };

  const getTicketCardContentStyle = () => {
    return {flex: 1};
  };

  const getTicketCardButtonStyle = () => {
    return {padding: 6};
  };

  const getActivityIndicatorStyle = () => {
    return {marginLeft: 6};
  };

  const fetchTickets = async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) {
        setRefreshing(true);
      }
      setErrorTickets('');
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) {
        setErrorTickets('User belum login');
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets(false);
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
        style={getScrollViewStyle()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTickets(true)}
            colors={['#F26522']}
            tintColor="#F26522"
          />
        }>
        <View style={styles.topCardContainer}>
          {refreshing ? (
            <View style={styles.skeletonTopCard}>
              <View style={styles.skeletonTopCardTitle} />
              <View style={styles.skeletonTopCardImage} />
              <View style={styles.skeletonTopCardText} />
              <View style={styles.skeletonTopCardText} />
              <View style={styles.skeletonTopCardText} />
            </View>
          ) : (
            <View style={styles.topCard}>
              <Text style={styles.topCardTitle}>Buat Permintaan Bantuan</Text>
              <View style={styles.illustrationContainer}>
                <View style={styles.illustrationWrapper}>
                  <Image
                    source={{
                      uri: 'https://portal.internetan.id/mobile/img/helps.png',
                    }}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                  />
                  <View style={styles.plusIconContainer}>
                    <Icon name="add" size={24} color="#F26522" />
                  </View>
                </View>
              </View>
              <Text style={styles.topCardSubtitle2}>
                Jika Anda tidak dapat menemukan solusi untuk masalah Anda, Anda
                dapat mengajukan permintaan bantuan dengan memilih departemen
                yang sesuai di bawah ini.
              </Text>
            </View>
          )}
        </View>
        {/* Tombol Lihat Daftar Ticket Anda */}
        {(tickets.length > 0 || refreshing) && (
          <TouchableOpacity
            style={styles.seeTicketsBtn}
            onPress={scrollToTickets}
            activeOpacity={0.7}
            disabled={scrollingToTickets || refreshing}>
            <Text style={styles.seeTicketsText}>
              {refreshing ? 'Loading ...' : 'Daftar Permintaan Bantuan Anda'}
            </Text>
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color="#F26522"
                style={getActivityIndicatorStyle()}
              />
            ) : scrollingToTickets ? (
              <ActivityIndicator
                size="small"
                color="#F26522"
                style={getActivityIndicatorStyle()}
              />
            ) : (
              <Icon name="expand-more" size={22} color="#F26522" />
            )}
          </TouchableOpacity>
        )}

        {/* Tombol Buat Permintaan Bantuan */}
        <View style={styles.createTicketContainer}>
          <TouchableOpacity
            style={styles.createTicketBtn}
            onPress={() => navigateTo('OpenTicket')}
            activeOpacity={0.7}>
            <View style={styles.createTicketIconContainer}>
              <Icon name="add" size={28} color="#fff" />
            </View>
            <Text style={styles.createTicketText}>Buat Permintaan Bantuan</Text>
            <Icon name="chevron-right" size={24} color="#F26522" />
          </TouchableOpacity>
        </View>
        {/* List Ticket */}
        <View style={styles.ticketSection}>
          <Text style={styles.ticketTitle}>Daftar Permintaan Bantuan Anda</Text>
          {refreshing ? (
            <View style={styles.skeletonTicketContainer}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.skeletonTicketCard}>
                  <View style={styles.skeletonTicketRow}>
                    <View style={styles.skeletonTicketContent}>
                      <View style={styles.skeletonText} />
                      <View style={styles.skeletonText} />
                      <View style={styles.skeletonText} />
                    </View>
                    <View style={styles.skeletonChevron} />
                  </View>
                </View>
              ))}
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
                <View style={getTicketCardRowStyle()}>
                  <View style={getTicketCardContentStyle()}>
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
                    onPress={() => navigateTo('TicketDetail', {tid: ticket.id})}
                    style={getTicketCardButtonStyle()}>
                    <Icon name="chevron-right" size={26} color="#F26522" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={getSpacerStyle()} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={getBottomNavStyle()}>
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
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainerActive}>
            <Icon name="help" size={25} color="#F26522" />
          </View>
          <Text style={styles.navTextActive}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <View style={styles.navIconContainerInactive}>
            <Icon2 name="person" size={24} color="#fff" />
          </View>
          <Text style={styles.navTextInactive}>Akun</Text>
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
    alignItems: 'center',
  },
  topCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    // textAlign: 'center',
    marginBottom: 25,
    marginTop: 4,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  illustrationWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F26522',
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
  skeletonTicketContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  skeletonTicketCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonTicketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonTicketContent: {
    flex: 1,
    marginRight: 10,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonChevron: {
    width: 26,
    height: 26,
    backgroundColor: '#e0e0e0',
    borderRadius: 13,
  },
  skeletonTopCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  skeletonTopCardTitle: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  skeletonTopCardImage: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
    borderRadius: 50,
    marginBottom: 10,
  },
  skeletonTopCardText: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  createTicketContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    // alignItems: 'center',
  },
  createTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F26522',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    minWidth: 260,
    justifyContent: 'center',
  },
  createTicketIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  createTicketText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default HelpScreen;
