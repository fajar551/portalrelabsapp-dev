import React from 'react';
import {
  Image,
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

const HelpScreen = ({navigateTo}: {navigateTo: (screen: string) => void}) => {
  const insets = useSafeAreaInsets();

  const departments = [
    {
      title: 'Technical Support',
      subtitle: '',
      icon: {name: 'support-agent', type: 'MaterialIcons'},
    },
    {
      title: 'Billing Support',
      subtitle: '',
      icon: {name: 'receipt', type: 'MaterialIcons'},
    },
    {
      title: 'Finance & Tax',
      subtitle: 'Faktur Pajak & Bukti Potong',
      icon: {name: 'attach-money', type: 'MaterialIcons'},
    },
  ];

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
        style={[styles.scrollView, {paddingBottom: 80 + insets.bottom}]}>
        <View style={styles.topCardContainer}>
          <View style={styles.topCard}>
            <Text style={styles.topCardTitle}>Open New Ticket</Text>
            <View style={styles.illustrationContainer}>
              <Image
                source={{
                  uri: 'https://portal.relabs.id/mobile/img/helps.png',
                }}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.topCardSubtitle}>Choose Department</Text>
            <Text style={styles.topCardSubtitle2}>
              If you can't find a solution to your problems in our
              knowledgebase, you can submit a ticket by selecting the
              appropriate department below.
            </Text>
          </View>
        </View>
        {/* Department List di luar card */}
        <View style={styles.departmentList}>
          {departments.map((dept, idx) => (
            <TouchableOpacity key={idx} style={styles.departmentCard}>
              <View style={styles.departmentIconWrap}>
                {dept.icon.type === 'MaterialIcons' ? (
                  <Icon name={dept.icon.name} size={24} color="#F26522" />
                ) : (
                  <Icon2 name={dept.icon.name} size={24} color="#F26522" />
                )}
              </View>
              <View style={styles.departmentTextWrap}>
                <Text style={styles.departmentTitle}>{dept.title}</Text>
                {!!dept.subtitle && (
                  <Text style={styles.departmentSubtitle}>{dept.subtitle}</Text>
                )}
              </View>
              <Icon
                name="chevron-right"
                size={22}
                color="#F26522"
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          ))}
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
    marginBottom: 12,
  },
  illustrationContainer: {
    alignItems: 'center',
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
  topCardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F26522',
  },
  topCardSubtitle2: {
    fontSize: 14,
    color: '#22325a',
    fontWeight: '400',
    textAlign: 'justify',
    marginTop: 15,
  },
  departmentList: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  departmentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff4ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  departmentTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  departmentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 2,
  },
  departmentSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  chevronIcon: {
    marginLeft: 8,
    alignSelf: 'center',
  },
});

export default HelpScreen;
