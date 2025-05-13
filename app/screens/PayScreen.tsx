import React, {useState} from 'react';
import {
  ActivityIndicator,
  // Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Mendapatkan lebar layar untuk kalkulasi
// const {width} = Dimensions.get('window');

const PayScreen = ({
  navigateTo,
  // onLogout,
}: {
  navigateTo: (screen: string) => void;
  // onLogout: () => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    month: string;
    year: number;
    amount: number;
    status: string;
  } | null>(null);
  const [isLoading] = useState(false);

  // Data pembayaran
  const paymentHistory = [
    {month: 'April', year: 2025, amount: 234765, status: 'Paid'},
    {month: 'March', year: 2025, amount: 234765, status: 'Paid'},
    {month: 'February', year: 2025, amount: 234765, status: 'Paid'},
  ];

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
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Due Date Period</Text>
          <View style={styles.periodContainer}>
            <Text style={styles.periodDate}>07 Apr</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar} />
            </View>
            <Text style={styles.periodDate}>23 Apr</Text>
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
        {/* <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🎫</Text>
          <Text style={styles.navText}>My Voucher</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <Text style={styles.navIcon}>👤</Text>
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
  header: {
    backgroundColor: '#00008B',
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
    backgroundColor: '#00008B',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    color: '#f0f0f0',
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
    color: '#00008B',
  },
  activeNavText: {
    color: '#00008B',
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
    backgroundColor: '#00008B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successIcon: {
    fontSize: 40,
    color: 'white',
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
    color: 'white',
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
    backgroundColor: '#0033a0',
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
});

export default PayScreen;
