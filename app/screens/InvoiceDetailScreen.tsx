import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {getDetailedClientInvoices} from '../../src/services/api';

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

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#0033a0" />
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
        colors={['#ffb347', '#fd7e14']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigateTo('Pay')}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Invoice</Text>
        <View style={styles.emptySpace} />
      </LinearGradient>

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
          <TouchableOpacity style={styles.payButton}>
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        )}
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
          onPress={() => navigateTo('Pay')}>
          <Text style={[styles.navIcon, styles.activeNav]}>💳</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Tagihan</Text>
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
    backgroundColor: '#fd7e14',
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
    backgroundColor: '#fd7e14',
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
    backgroundColor: '#fd7e14',
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
});

export default InvoiceDetailScreen;
