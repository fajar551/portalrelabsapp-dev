import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import Icon2 from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getClientInvoices,
  getInvoiceDetails,
  getPaymentGateways,
  getPaymentHistory,
} from '../../src/services/api';

// Mendapatkan lebar layar untuk kalkulasi
// const {width} = Dimensions.get('window');

const PayScreen = ({
  navigateTo,
  onLogout,
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentGatewayModalVisible, setPaymentGatewayModalVisible] =
    useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    id?: number;
    invoicenum?: string;
    month: string;
    year: number;
    amount: number;
    status: string;
    datepaid?: string;
    paymentmethod?: string;
    details?: Array<{
      description: string;
      amount: number;
    }>;
    charges?: Array<{
      description: string;
      amount: number;
    }>;
    taxes?: Array<{
      description: string;
      amount: number;
    }>;
    monthly_charges?: Array<{
      description: string;
      amount: number;
    }>;
    prorated_charges?: Array<{
      description: string;
      amount: number;
    }>;
  } | null>(null);
  const [selectedGateway] = useState<{
    id: number;
    name: string;
    description: string;
    instructions: string;
    is_va?: boolean;
  } | null>(null);
  const [paymentGateways, setPaymentGateways] = useState<
    Array<{
      id: number;
      name: string;
      description: string;
      instructions: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGatewaysLoading, setIsGatewaysLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [_progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [billingPeriod, setBillingPeriod] = useState({
    startDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 14 days from now
    amount: 0, // Default 0 yang berarti tidak ada tagihan
  });

  // Data pembayaran dari API
  const [paymentHistory, setPaymentHistory] = useState<
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

  const [refreshing, setRefreshing] = useState(false);

  const formatRupiah = (amount: number) => {
    // Gunakan NumberFormat dari Intl untuk format yang benar sesuai standar Indonesia
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch invoice data from API
  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Fungsi untuk mengambil data invoice
  const fetchInvoiceData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Mengambil data invoice untuk billing period
      const invoices = await getClientInvoices();

      // Filter untuk mendapatkan invoice yang belum dibayar (Unpaid)
      const unpaidInvoices = invoices.filter(
        (invoice: any) =>
          invoice.status === 'Unpaid' || invoice.status === 'Belum Dibayar',
      );

      // Get most recent unpaid invoice
      if (unpaidInvoices && unpaidInvoices.length > 0) {
        const latestUnpaidInvoice = unpaidInvoices[0]; // Ambil yang paling baru

        // Extract date and duedate from the invoice
        if (latestUnpaidInvoice.date && latestUnpaidInvoice.duedate) {
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

        if (latestInvoice.date && latestInvoice.duedate) {
          setBillingPeriod({
            startDate: new Date(latestInvoice.date),
            dueDate: new Date(latestInvoice.duedate),
            amount: 0, // Tandai tidak ada yang perlu dibayar
          });
        }
      } else {
        // Tidak ada invoice sama sekali
        setBillingPeriod({
          startDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          amount: 0,
        });
      }

      // Mengambil data riwayat pembayaran
      const payments = await getPaymentHistory();
      if (payments && payments.length > 0) {
        setPaymentHistory(payments);
      } else {
        // Jangan gunakan fallback data, biarkan array kosong
        setPaymentHistory([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
      // Jika error, set billing amount ke 0 untuk menunjukkan tidak ada tagihan
      setBillingPeriod(prev => ({...prev, amount: 0}));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Menghitung hari tersisa dan progress
  useEffect(() => {
    const calculateProgress = () => {
      const today = new Date();

      // Total hari dalam periode (menambahkan +1 untuk menghitung hari terakhir)
      const totalDays = Math.floor(
        (billingPeriod.dueDate.getTime() - billingPeriod.startDate.getTime()) /
          (1000 * 3600 * 24),
      ); // Ditambahkan +1 untuk menghitung hari terakhir

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

  // Fungsi untuk menampilkan modal detail pembayaran
  const showPaymentDetail = async (payment: {
    id?: number;
    invoicenum?: string;
    month: string;
    year: number;
    amount: number;
    status: string;
    datepaid?: string;
    paymentmethod?: string;
  }) => {
    setSelectedPayment(payment);
    setModalVisible(true);
    setIsDetailLoading(true);

    try {
      // Memanggil API untuk mendapatkan detail invoice
      if (payment.id || payment.invoicenum) {
        const invoiceDetails = await getInvoiceDetails(
          payment.id || payment.invoicenum,
        );
        if (invoiceDetails) {
          setSelectedPayment(prev => ({
            ...prev,
            ...invoiceDetails,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Fungsi untuk menangani klik tombol detail invoice
  const handleViewInvoiceDetails = () => {
    navigateTo('InvoiceDetail');
  };

  // Format tanggal untuk tampilan
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('id-ID', {month: 'short'});
    return {day, month};
  };

  // Fetch payment gateways
  const fetchPaymentGateways = async () => {
    setIsGatewaysLoading(true);
    try {
      const gateways = await getPaymentGateways();
      if (gateways && gateways.length > 0) {
        setPaymentGateways(gateways);
      } else {
        setPaymentGateways([]);
      }
    } catch (err) {
      console.error('Error fetching payment gateways:', err);
    } finally {
      setIsGatewaysLoading(false);
    }
  };

  // Handle "Bayar Sekarang" button press
  const handlePayNow = () => {
    fetchPaymentGateways();
    setPaymentGatewayModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoiceData();
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
      <StatusBar backgroundColor="#00008B" barStyle="light-content" />

      <LinearGradient
        colors={['#ffb347', '#fd7e14']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <Text style={styles.headerTitle}>Pembayaran</Text>
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
        {/* Due Date Period - hanya tampilkan jika ada tagihan yang belum dibayar */}
        {billingPeriod.amount > 0 ? (
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
                  <View style={styles.progressBarContainer}>
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
                  </View>

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
                          transform: [{translateX: -4}],
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

        {/* Payment Status */}
        <View style={styles.paymentStatusContainer}>
          <View style={styles.paymentStatusIcon}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.paymentStatusText}>
            {billingPeriod.amount > 0
              ? 'Pembayaran terakhir telah diterima'
              : 'Semua tagihan telah dibayar'}
          </Text>
        </View>

        {/* Last Payment Section */}
        <View style={[styles.lastPaymentContainer]}>
          <Text style={styles.lastPaymentTitle}>Pembayaran Terakhir</Text>

          {/* Payment History List */}
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment, index) => (
              <TouchableOpacity
                key={index}
                style={styles.paymentItem}
                onPress={() => showPaymentDetail(payment)}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentPeriod}>
                    {payment.month} {payment.year}
                  </Text>
                  <View style={styles.paymentStatusBadge}>
                    <Text style={styles.paymentStatusBadgeText}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentAmountText}>
                    {formatRupiah(payment.amount)}
                  </Text>
                  <Text style={styles.arrowIcon}>›</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noPaymentHistoryContainer}>
              <Text style={styles.noPaymentHistoryText}>
                Belum ada riwayat pembayaran
              </Text>
            </View>
          )}
        </View>

        {/* Tambahkan tombol Detail Invoice */}
        <View style={styles.detailInvoiceContainer}>
          <TouchableOpacity
            style={styles.detailInvoiceButton}
            onPress={handleViewInvoiceDetails}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.detailInvoiceButtonText}>
                Lihat Detail Invoice
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Home')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="home" size={24} color="#666" />
          </View>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <LinearGradient
            colors={['#ffb347', '#fd7e14']}
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

      {/* Payment Gateway Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentGatewayModalVisible}
        onRequestClose={() => setPaymentGatewayModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.gatewayModalContent}>
            <View style={styles.gatewayModalHeader}>
              <Text style={styles.gatewayModalTitle}>
                Pilih Metode Pembayaran
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setPaymentGatewayModalVisible(false)}>
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
              ) : paymentGateways.length > 0 ? (
                <FlatList
                  data={paymentGateways}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.gatewayItem}
                      onPress={async () => {
                        try {
                          await AsyncStorage.setItem(
                            'selectedGateway',
                            JSON.stringify(item),
                          );
                          if (billingPeriod.amount > 0) {
                            const invoices = await getClientInvoices();
                            const unpaidInvoice = invoices.find(
                              (invoice: any) =>
                                invoice.status === 'Unpaid' ||
                                invoice.status === 'Belum Dibayar',
                            );
                            if (unpaidInvoice) {
                              await AsyncStorage.setItem(
                                'currentInvoice',
                                JSON.stringify(unpaidInvoice),
                              );
                            }
                          }
                          setPaymentGatewayModalVisible(false);
                          navigateTo('PaymentInstructions');
                        } catch (err) {
                          Alert.alert(
                            'Error',
                            'Gagal menyimpan data pembayaran. Silakan coba lagi.',
                          );
                        }
                      }}>
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

      {/* Payment Instructions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && selectedGateway !== null}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>📝</Text>
              </View>
              <Text style={styles.modalTitle}>Instruksi Pembayaran</Text>
            </View>

            <View style={styles.paymentDetailCard}>
              <View style={styles.paymentPeriodHeader}>
                <Text style={styles.paymentPeriodTitle}>
                  {selectedGateway?.name}
                </Text>
                <View style={styles.totalBillContainer}>
                  <Text style={styles.totalBillLabel}>Total Tagihan</Text>
                  <Text style={styles.totalBillAmount}>
                    Rp {billingPeriod.amount.toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              <View style={styles.billingDetailContainer}>
                <Text style={styles.billingDetailHeader}>Cara Pembayaran</Text>

                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsText}>
                    {selectedGateway?.instructions ||
                      'Tidak ada instruksi tersedia.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.shareButtonText}>Kembali</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Original Detail Payment Modal (keep this) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>👨‍💻</Text>
              </View>
              <Text style={styles.modalTitle}>Pembayaran Berhasil</Text>
            </View>

            {isDetailLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fd7e14" />
                <Text style={styles.loadingText}>
                  Memuat detail pembayaran...
                </Text>
              </View>
            ) : (
              <View style={styles.paymentDetailCard}>
                <View style={styles.paymentPeriodHeader}>
                  <Text style={styles.paymentPeriodTitle}>
                    {selectedPayment?.invoicenum
                      ? `Invoice #${selectedPayment?.invoicenum}`
                      : `${selectedPayment?.month} ${selectedPayment?.year}`}
                  </Text>
                  <View style={styles.totalBillContainer}>
                    <Text style={styles.totalBillLabel}>Total Tagihan</Text>
                    <Text style={styles.totalBillAmount}>
                      Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.paidStatusContainer}>
                    <Text style={styles.paidStatusText}>Dibayar</Text>
                  </View>
                </View>

                <View style={styles.billingDetailContainer}>
                  <View style={styles.billingDetailRow}>
                    <Text style={styles.billingDetailLabel2}>
                      Tanggal Tagihan
                    </Text>
                    <Text style={styles.billingDetailValue}>
                      {selectedPayment?.datepaid
                        ? new Date(selectedPayment.datepaid).toLocaleDateString(
                            'id-ID',
                            {day: '2-digit', month: 'short', year: 'numeric'},
                          )
                        : ''}
                    </Text>
                  </View>

                  <Text style={styles.billingDetailHeader}>
                    Rincian Tagihan
                  </Text>

                  <View style={styles.billingDetailRow}>
                    <Text style={styles.billingDetailLabel}>
                      SALDO SEBELUMNYA
                    </Text>
                    <Text style={styles.billingDetailValue}>
                      Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <View style={styles.billingDetailRow}>
                    <Text style={styles.billingDetailLabel}>Total Dibayar</Text>
                    <Text style={styles.billingDetailValueNegative}>
                      -Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <View style={styles.billingDetailRow}>
                    <Text style={styles.billingDetailLabel}>
                      Metode Pembayaran
                    </Text>
                    <Text style={styles.billingDetailValue}>
                      {selectedPayment?.paymentmethod || ''}
                    </Text>
                  </View>

                  {/* Biaya dan Charges dinamis dari API */}
                  {selectedPayment?.charges?.map((charge, index) => (
                    <View
                      key={`charge-${index}`}
                      style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel}>
                        {charge.description}
                      </Text>
                      <Text style={styles.billingDetailValue}>
                        Rp {charge.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}

                  {/* Pajak dinamis dari API */}
                  {selectedPayment?.taxes?.map((tax, index) => (
                    <View key={`tax-${index}`} style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel}>
                        {tax.description}
                      </Text>
                      <Text style={styles.billingDetailValue}>
                        Rp {tax.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}

                  {/* Monthly charges dinamis dari API */}
                  {selectedPayment?.monthly_charges?.map((item, index) => (
                    <View
                      key={`monthly-${index}`}
                      style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel2}>
                        {item.description}
                      </Text>
                      <Text style={styles.billingDetailValue}>
                        Rp {item.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}

                  {selectedPayment?.prorated_charges &&
                    selectedPayment.prorated_charges.length > 0 && (
                      <View style={styles.billingDetailRow}>
                        <Text style={styles.billingDetailSectionHeader}>
                          *PRORATED BILLING AMOUNT*
                        </Text>
                        <Text style={styles.billingDetailValue}>
                          Rp{' '}
                          {selectedPayment.prorated_charges
                            .reduce((total, item) => total + item.amount, 0)
                            .toLocaleString('id-ID')}
                        </Text>
                      </View>
                    )}

                  {/* Prorated charges dinamis dari API */}
                  {selectedPayment?.prorated_charges?.map((item, index) => (
                    <View
                      key={`prorated-${index}`}
                      style={styles.billingDetailRow}>
                      <Text style={styles.billingDetailLabel}>
                        {item.description}
                      </Text>
                      <Text style={styles.billingDetailValue}>
                        Rp {item.amount.toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.shareButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#fd7e14',
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerIconText: {
    fontSize: 24,
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
  fullWidthContainer: {
    width: '100%',
  },
  headerTitle: {
    color: '#f0f0f0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#fd7e14',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 15,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodDate: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    marginHorizontal: 10,
  },
  progressBar: {
    width: '80%',
    height: 12,
    borderRadius: 6,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ee',
    borderRadius: 5,
    padding: 15,
    margin: 15,
  },
  paymentStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CD964',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkIcon: {
    color: 'white',
    fontWeight: 'bold',
  },
  paymentStatusText: {
    color: '#333',
    fontSize: 16,
  },
  lastPaymentContainer: {
    // backgroundColor: '#ddd',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
    width: '100%',
  },
  lastPaymentTitle: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  paymentInfo: {
    flexDirection: 'column',
  },
  paymentPeriod: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentStatusBadge: {
    backgroundColor: '#4CD964',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  paymentStatusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentAmountText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
    marginRight: 5,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#999',
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
  modalContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    marginTop: 180,
  },
  modalHeader: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
    alignItems: 'flex-end',
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fd7e14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 35,
  },
  successIcon: {
    fontSize: 40,
    color: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentDetailCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    overflow: 'hidden',
  },
  paymentPeriodHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentPeriodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  totalBillContainer: {
    marginTop: 5,
  },
  totalBillLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalBillAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fd7e14',
  },
  paidStatusContainer: {
    position: 'absolute',
    right: 15,
    top: 15,
    backgroundColor: '#4CD964',
    paddingVertical: 3,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  paidStatusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  billingDetailContainer: {
    padding: 15,
  },
  billingDetailHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#999',
    marginBottom: 10,
  },
  billingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billingDetailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  billingDetailLabel2: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  billingDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'right',
  },
  billingDetailValueNegative: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'right',
  },
  billingDetailSectionHeader: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#ddd',
    padding: 15,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailInvoiceContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  detailInvoiceButton: {
    backgroundColor: '#fd7e14',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '86%',
  },
  detailInvoiceButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  noPaymentHistoryContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  noPaymentHistoryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Payment Gateway Modal styles
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
  instructionsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalCloseButton: {
    padding: 5,
  },
  dueCardContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
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
});

export default PayScreen;
