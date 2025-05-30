import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import {
  getDetailedClientInvoices,
  getPaymentGateways,
} from '../../src/services/api';

const InvoiceDetailScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isGatewaysLoading, setIsGatewaysLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchInvoiceDetails();
  }, []);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDetailedClientInvoices();
      setInvoiceData(data);

      // Jika ada invoice, pilih yang pertama secara default
      if (data.invoices && data.invoices.length > 0) {
        setSelectedInvoiceId(data.invoices[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat detail invoice',
      );
      console.error('Error loading invoice details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoiceDetails();
  };

  const getSelectedInvoice = () => {
    if (!invoiceData || !invoiceData.invoices) {
      return null;
    }
    return invoiceData.invoices.find(
      (inv: any) => inv.id === selectedInvoiceId,
    );
  };

  const getInvoiceItems = () => {
    const invoice = getSelectedInvoice();
    return invoice ? invoice.items : [];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayNow = async () => {
    try {
      if (!selectedInvoiceId) {
        Alert.alert('Error', 'Invoice ID tidak ditemukan');
        return;
      }

      setIsGatewaysLoading(true);
      // Ambil metode pembayaran dari API
      const gateways = await getPaymentGateways();

      if (gateways && gateways.length > 0) {
        setPaymentMethods(gateways);
        setShowPaymentMethods(true);
      } else {
        Alert.alert('Error', 'Tidak ada metode pembayaran yang tersedia');
      }
    } catch (err) {
      console.error('Error in handlePayNow:', err);
      Alert.alert('Error', 'Gagal memproses pembayaran');
    } finally {
      setIsGatewaysLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method: any) => {
    try {
      // Simpan invoice dan payment method ke AsyncStorage
      await AsyncStorage.setItem(
        'currentInvoice',
        JSON.stringify({
          id: selectedInvoiceId,
          total: getSelectedInvoice()?.total,
        }),
      );

      await AsyncStorage.setItem(
        'selectedGateway',
        JSON.stringify({
          id: method.id,
          name: method.name,
          description: method.description,
          instructions: method.instructions,
          gateway_name: method.gateway_name,
          is_va: method.is_va,
        }),
      );

      // Navigate ke PaymentInstructionsScreen
      navigateTo('PaymentInstructions');
      setShowPaymentMethods(false);
    } catch (err) {
      console.error('Error selecting payment method:', err);
      Alert.alert('Error', 'Gagal memilih metode pembayaran');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#fd7e14" />
        <Text style={styles.loadingText}>Memuat data invoice...</Text>
      </SafeAreaView>
    );
  }

  // Render error state
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
              fetchInvoiceDetails();
            }
          }}>
          <Text style={styles.retryButtonText}>
            {isAuthError ? 'Kembali ke Login' : 'Coba Lagi'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render no data state
  if (
    !invoiceData ||
    !invoiceData.invoices ||
    invoiceData.invoices.length === 0
  ) {
    return (
      <SafeAreaView style={[styles.root, styles.centerContainer]}>
        <Text style={styles.noDataText}>Tidak ada invoice yang tersedia.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigateTo('Pay')}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const selectedInvoice = getSelectedInvoice();
  const invoiceItems = getInvoiceItems();

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('Pay')}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Invoice</Text>
        <View style={styles.emptySpace} />
      </LinearGradient>

      <ScrollView
        style={[styles.scrollView, {paddingBottom: 80 + insets.bottom}]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F26522', '#E4571B']}
            tintColor="#F26522"
          />
        }>
        {/* Invoice List Selector */}
        <View style={styles.invoiceSelector}>
          <Text style={styles.sectionTitle}>Pilih Invoice:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.invoiceTabsContainer}>
            {invoiceData.invoices.map((invoice: any) => (
              <TouchableOpacity
                key={invoice.id}
                style={[
                  styles.invoiceTab,
                  selectedInvoiceId === invoice.id && styles.activeInvoiceTab,
                ]}
                onPress={() => setSelectedInvoiceId(invoice.id)}>
                <Text
                  style={[
                    styles.invoiceTabText,
                    selectedInvoiceId === invoice.id &&
                      styles.activeInvoiceTabText,
                  ]}>
                  {invoice.invoicenum
                    ? `#${invoice.invoicenum}`
                    : `INV-${invoice.id}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Invoice Summary */}
        <View style={styles.invoiceSummary}>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>
              {selectedInvoice.invoicenum
                ? `Invoice #${selectedInvoice.invoicenum}`
                : `Invoice #${selectedInvoice.id}`}
            </Text>
            <View
              style={[
                styles.statusBadge,
                selectedInvoice.status === 'Unpaid'
                  ? styles.unpaidBadge
                  : selectedInvoice.status === 'Paid'
                  ? styles.paidBadge
                  : styles.otherStatusBadge,
              ]}>
              <Text style={styles.statusText}>
                {selectedInvoice.status_text || selectedInvoice.status}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal Invoice:</Text>
            <Text style={styles.detailValue}>
              {selectedInvoice.formatted_date || selectedInvoice.date}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jatuh Tempo:</Text>
            <Text style={styles.detailValue}>
              {selectedInvoice.formatted_duedate || selectedInvoice.duedate}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Metode Pembayaran:</Text>
            <Text style={styles.detailValue}>
              {selectedInvoice.paymentmethod || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pajak:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(selectedInvoice.tax)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.detailTotal}>
              {formatCurrency(selectedInvoice.total)}
            </Text>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.invoiceSummary}>
          <Text style={styles.sectionTitle}>Item Invoice:</Text>
          {invoiceItems.length > 0 ? (
            invoiceItems.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.invoiceItem}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.itemAmountRow}>
                  <Text style={styles.itemLabel}>Jumlah:</Text>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>
              Tidak ada item detail yang tersedia
            </Text>
          )}
        </View>

        {/* Hosting Services related to this invoice (if any) */}
        <View style={styles.hostingServices}>
          <Text style={styles.sectionTitle}>Layanan Hosting Terkait:</Text>
          {invoiceData.hosting.map((service: any) => (
            <View key={service.hosting_id} style={styles.hostingItem}>
              <Text style={styles.hostingName}>{service.product_name}</Text>
              <Text style={styles.hostingDomain}>{service.domain}</Text>
              <View style={styles.hostingDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.hostingStatus,
                      service.domainstatus === 'Active' && styles.activeStatus,
                      service.domainstatus === 'Pending' &&
                        styles.pendingStatus,
                      service.domainstatus === 'Suspended' &&
                        styles.suspendedStatus,
                    ]}>
                    {service.domainstatus}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Siklus Penagihan:</Text>
                  <Text style={styles.detailValue}>{service.billingcycle}</Text>
                </View>
                <Text style={styles.detailLabel}>Jatuh Tempo Berikutnya:</Text>
                <Text style={styles.detailValue}>{service.nextduedate}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pay Button (if unpaid) */}
        {selectedInvoice.status === 'Unpaid' && (
          <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        )}
        <View style={{height: 100 + insets.bottom}} />
      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          },
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
          <LinearGradient
            // colors={['#ffb347', '#fd7e14']}
            colors={['#E4571B', '#F26522']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.navIconContainer}>
            <Icon name="receipt" size={24} color="#fff" />
          </LinearGradient>
          <Text style={[styles.navText, styles.activeNavText]}>Tagihan</Text>
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

      {/* Payment Methods Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentMethods}
        onRequestClose={() => setShowPaymentMethods(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.gatewayModalContent}>
            <View style={styles.gatewayModalHeader}>
              <Text style={styles.gatewayModalTitle}>
                Pilih Metode Pembayaran
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPaymentMethods(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gatewayList}>
              {isGatewaysLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fd7e14" />
                  <Text style={styles.loadingText}>
                    Memuat metode pembayaran...
                  </Text>
                </View>
              ) : paymentMethods.length > 0 ? (
                <FlatList
                  data={paymentMethods}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.gatewayItem}
                      onPress={() => handlePaymentMethodSelect(item)}>
                      <View style={styles.gatewayInfo}>
                        <Text style={styles.gatewayName}>{item.name}</Text>
                        <Text style={styles.gatewayDescription}>
                          {item.description}
                        </Text>
                      </View>
                      <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={styles.noGatewaysContainer}>
                  <Text style={styles.noGatewaysText}>
                    Tidak ada metode pembayaran tersedia
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f9ff',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    flex: 1,
    textAlign: 'center',
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
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
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#F26522',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  invoiceSelector: {
    marginBottom: 20,
  },
  invoiceTabsContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  invoiceTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
  },
  activeInvoiceTab: {
    backgroundColor: '#fd7e14',
  },
  invoiceTabText: {
    color: '#333',
    fontWeight: '500',
  },
  activeInvoiceTabText: {
    color: 'white',
  },
  invoiceSummary: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    zIndex: 100,
  },
  unpaidBadge: {
    backgroundColor: '#ffe0e0',
    zIndex: 100,
  },
  paidBadge: {
    backgroundColor: '#e0ffe0',
    zIndex: 100,
  },
  otherStatusBadge: {
    backgroundColor: '#e0e0ff',
    zIndex: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    zIndex: 100,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    color: '#666',
    flex: 1,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
    color: '#999',
  },
  detailTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#fd7e14',
    fontSize: 16,
  },
  invoiceItems: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  invoiceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  itemDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  itemAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemLabel: {
    color: '#666',
  },
  itemAmount: {
    fontWeight: 'bold',
    color: '#666',
  },
  taxedItem: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  noItemsText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  hostingServices: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  hostingItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  hostingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
  },
  hostingDomain: {
    fontSize: 14,
    color: '#fd7e14',
    marginBottom: 10,
  },
  hostingDetails: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
  },
  hostingStatus: {
    fontWeight: 'bold',
  },
  activeStatus: {
    color: 'green',
  },
  pendingStatus: {
    color: 'orange',
  },
  suspendedStatus: {
    color: 'red',
  },
  payButton: {
    backgroundColor: '#F26522',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 30,
  },
  payButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 5,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  activeNav: {
    color: '#fd7e14',
  },
  activeNavText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gatewayModalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    alignSelf: 'center',
  },
  gatewayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  gatewayModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  gatewayList: {
    maxHeight: '80%',
  },
  gatewayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  gatewayDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalCloseButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGatewaysContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGatewaysText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  arrowIcon: {
    color: '#666',
    fontSize: 16,
  },
});

export default InvoiceDetailScreen;
