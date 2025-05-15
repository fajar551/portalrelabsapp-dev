import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getClientInvoices} from '../../src/services/api';

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
  const [selectedPayment, setSelectedPayment] = useState<{
    month: string;
    year: number;
    amount: number;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [_progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [billingPeriod, setBillingPeriod] = useState({
    startDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 14 days from now
    amount: 234765,
  });

  // Data pembayaran
  const paymentHistory = [
    {month: 'April', year: 2025, amount: 234765, status: 'Paid'},
    {month: 'March', year: 2025, amount: 234765, status: 'Paid'},
    {month: 'February', year: 2025, amount: 234765, status: 'Paid'},
  ];

  // Fetch invoice data from API
  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Fungsi untuk mengambil data invoice
  const fetchInvoiceData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const invoices = await getClientInvoices();

      // Get most recent invoice (assuming they are ordered by date)
      if (invoices && invoices.length > 0) {
        const latestInvoice = invoices[0];

        // Extract date and duedate from the invoice
        if (latestInvoice.date && latestInvoice.duedate) {
          setBillingPeriod({
            startDate: new Date(latestInvoice.date),
            dueDate: new Date(latestInvoice.duedate),
            amount: latestInvoice.total || 234765,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(
        err instanceof Error ? err.message : 'Gagal memuat data invoice',
      );
      // Keep using default dates if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  // Menghitung hari tersisa dan progress
  useEffect(() => {
    const calculateProgress = () => {
      const today = new Date();

      // Total hari dalam periode (menambahkan +1 untuk menghitung hari terakhir)
      const totalDays =
        Math.floor(
          (billingPeriod.dueDate.getTime() -
            billingPeriod.startDate.getTime()) /
            (1000 * 3600 * 24),
        ) + 1; // Ditambahkan +1 untuk menghitung hari terakhir

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

      // Kalkulasi progres (0-1)
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

  // Fungsi untuk menampilkan modal detail pembayaran
  const showPaymentDetail = (payment: {
    month: string;
    year: number;
    amount: number;
    status: string;
  }) => {
    setSelectedPayment(payment);
    setModalVisible(true);
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📄</Text>
        </View>
        <Text style={styles.headerTitle}>Bill</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Due Date Period */}
        <View style={styles.dueCardContainer}>
          <View style={styles.dueCard}>
            <View style={styles.dueCardHeader}>
              <Text style={styles.dueCardTitle}>Periode Jatuh Tempo</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Total Tagihan</Text>
                <Text style={styles.amountValue}>
                  Rp {billingPeriod.amount.toLocaleString('id-ID')}
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
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressDot} />
                </View>

                <Text style={styles.progressText}>{daysLeft} Hari Tersisa</Text>
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
              <TouchableOpacity style={styles.duePayButton}>
                <Text style={styles.duePayButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.paymentStatusContainer}>
          <View style={styles.paymentStatusIcon}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.paymentStatusText}>
            Payment has been received
          </Text>
        </View>

        {/* Last Payment Section */}
        <View style={[styles.lastPaymentContainer]}>
          <Text style={styles.lastPaymentTitle}>Last Payment</Text>

          {/* Payment History List */}
          {paymentHistory.map((payment, index) => (
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
                  Rp {payment.amount.toLocaleString('id-ID')}
                </Text>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
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
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('PaymentSuccess')}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNav]}>💳</Text>
          <Text style={[styles.navText, styles.activeNavText]}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <View style={styles.personIcon}>
            <Image
              source={require('../assets/user.png')}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.navText}>Account</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Detail Pembayaran */}
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
              <Text style={styles.modalTitle}>Successful Payment</Text>
            </View>

            <View style={styles.paymentDetailCard}>
              <View style={styles.paymentPeriodHeader}>
                <Text style={styles.paymentPeriodTitle}>
                  {selectedPayment?.month} {selectedPayment?.year}
                </Text>
                <View style={styles.totalBillContainer}>
                  <Text style={styles.totalBillLabel}>Total Bill</Text>
                  <Text style={styles.totalBillAmount}>
                    Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.paidStatusContainer}>
                  <Text style={styles.paidStatusText}>Paid</Text>
                </View>
              </View>

              <View style={styles.billingDetailContainer}>
                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    Billing Statement Date
                  </Text>
                  <Text style={styles.billingDetailValue}>07 Apr 2025</Text>
                </View>

                <Text style={styles.billingDetailHeader}>Rincian Tagihan</Text>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    PREVIOUS BALANCE
                  </Text>
                  <Text style={styles.billingDetailValue}>
                    Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                  </Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    Payment - Thank you
                  </Text>
                  <Text style={styles.billingDetailValueNegative}>
                    -Rp {selectedPayment?.amount.toLocaleString('id-ID')}
                  </Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>Payment Charges</Text>
                  <Text style={styles.billingDetailValue}>Rp 5.000</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>Tax</Text>
                  <Text style={styles.billingDetailValue}>Rp 550</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailSectionHeader}>
                    *MONTHLY CHARGES*
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 0</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    FN JOY_VALUE SPC 50 12M
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 41.800</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    HC JOY_VALUE SPC 50 12M
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 62.700</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    MODEM 3.0 CHARGE
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 30.000</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>
                    ROUTER D 3.0 CHARGE
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 20.000</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>STB HD CHARGE</Text>
                  <Text style={styles.billingDetailValue}>Rp 46.000</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>E-BILLING FEE</Text>
                  <Text style={styles.billingDetailValue}>Rp 6.000</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailSectionHeader}>
                    *PRORATED BILLING AMOUNT*
                  </Text>
                  <Text style={styles.billingDetailValue}>Rp 0</Text>
                </View>

                <View style={styles.billingDetailRow}>
                  <Text style={styles.billingDetailLabel}>Tax</Text>
                  <Text style={styles.billingDetailValue}>Rp 22.715</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
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
    backgroundColor: '#4CD964',
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
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fd7e14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    color: '#999',
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
  navIconImage: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  activeIconContainer: {
    // Tidak perlu tambahan style karena icon sudah berwarna
  },
  activeIconImage: {
    tintColor: '#fd7e14',
  },
  // Styles for new Due Date Card
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
    backgroundColor: '#fd7e14',
    borderRadius: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fd7e14',
    position: 'absolute',
    left: 0, // Akan diposisikan oleh Animated, menggantikan static value
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
});

export default PayScreen;
