import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getInvoiceById} from '../../src/services/api';

const PaymentInstructionsScreen = ({
  navigateTo,
  onLogout: _onLogout, // Prefix with _ to indicate it's not used
}: {
  navigateTo: (screen: string) => void;
  onLogout: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [_invoiceData, setInvoiceData] = useState<any>(null); // Prefixed with _ to indicate it's not used directly
  const [selectedGateway, setSelectedGateway] = useState<any>(null);
  const [virtualAccountNumber, setVirtualAccountNumber] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Ambil data gateway dari AsyncStorage
      const gatewayData = await AsyncStorage.getItem('selectedGateway');

      // Ambil data invoice dari AsyncStorage
      const invoiceInfo = await AsyncStorage.getItem('currentInvoice');

      // Variabel untuk menyimpan gateway yang dipilih
      let parsedGateway = null;

      if (gatewayData) {
        parsedGateway = JSON.parse(gatewayData);
        setSelectedGateway(parsedGateway);

        // Set instruksi pembayaran dari gateway
        if (parsedGateway.instructions) {
          setPaymentInstructions(parsedGateway.instructions);
        }
      }

      if (invoiceInfo) {
        const invoice = JSON.parse(invoiceInfo);
        setInvoiceData(invoice);

        // Dapatkan detail invoice termasuk payment info
        if (invoice.id) {
          const invoiceDetails = await getInvoiceById(invoice.id);

          if (invoiceDetails) {
            console.log('Invoice details:', JSON.stringify(invoiceDetails));

            // Set total amount dari struktur response yang benar
            if (invoiceDetails.invoice && invoiceDetails.invoice.total) {
              setTotalAmount(parseFloat(invoiceDetails.invoice.total));
            }

            // Cek payment info dan pilih nomor VA yang tepat berdasarkan gateway yang dipilih
            if (invoiceDetails.payment_info && parsedGateway) {
              // Mendapatkan gateway yang dipilih
              const selectedGatewayName =
                parsedGateway?.name?.toLowerCase() || '';

              // Default mengambil VA dari payment_info utama
              let vaNumber =
                invoiceDetails.payment_info.va_number ||
                invoiceDetails.payment_info.virtual_account_number ||
                invoiceDetails.payment_info.account_number ||
                '';

              // Cek available_payment_methods untuk mendapatkan VA yang sesuai dengan gateway yang dipilih
              if (
                invoiceDetails.payment_info.available_payment_methods &&
                Array.isArray(
                  invoiceDetails.payment_info.available_payment_methods,
                )
              ) {
                // Cari gateway yang cocok dalam available_payment_methods
                const matchingGateway =
                  invoiceDetails.payment_info.available_payment_methods.find(
                    (method: any) => {
                      const methodName =
                        method.gateway_name?.toLowerCase() || '';
                      const methodGateway = method.gateway?.toLowerCase() || '';

                      // Coba cocokkan gateway berdasarkan nama atau identifikasi lain
                      return (
                        methodGateway === selectedGatewayName ||
                        methodName.includes(selectedGatewayName) ||
                        selectedGatewayName.includes(methodGateway)
                      );
                    },
                  );

                // Jika gateway cocok ditemukan, gunakan VA number dari gateway tersebut
                if (matchingGateway && matchingGateway.va_number) {
                  vaNumber = matchingGateway.va_number;
                  console.log('Found matching VA for gateway:', vaNumber);
                }
              }

              // Set virtual account number
              if (vaNumber) {
                setVirtualAccountNumber(vaNumber);
              }
            }
          }
        }
      }
    } catch (err) {
      setError('Gagal memuat data instruksi pembayaran');
      console.error('Error loading payment instructions data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Format instruksi dengan nomor VA
  const formatInstructions = (instructions: string) => {
    if (!instructions) {
      return 'Tidak ada instruksi tersedia.';
    }

    // Hapus semua tag HTML dari instruksi
    let plainInstructions = instructions.replace(/<\/?[^>]+(>|$)/g, '');

    // Ganti dengan instruksi standar yang lebih sederhana
    if (virtualAccountNumber) {
      return `Silahkan melakukan pembayaran ke nomor Virtual Account Anda berikut:\n\n${virtualAccountNumber}`;
    }

    // Jika tidak ada VA, tampilkan instruksi tanpa tag HTML
    return plainInstructions;
  };

  // Handle kembali ke halaman Pay
  const handleBack = () => {
    navigateTo('Pay');
  };

  // Handle pembayaran selesai
  const handlePaymentComplete = () => {
    Alert.alert(
      'Konfirmasi Pembayaran',
      'Apakah Anda sudah melakukan pembayaran?',
      [
        {
          text: 'Belum',
          style: 'cancel',
        },
        {
          text: 'Sudah',
          // onPress: () => navigateTo('PaymentSuccess'),
          onPress: () => navigateTo('Pay'),
        },
      ],
    );
  };

  // Fungsi untuk handle klik Pay Now
  const handlePayNow = async () => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke DANA sebelum proses pembayaran
      // const csrfToken = await getCsrfToken();
      const updateRes = await updatePaymentMethod(invoice.id, 'danaxendit');
      console.log('Update Payment Method Response:', updateRes);

      if (
        updateRes === 'DANA' ||
        updateRes === 'danaxendit' ||
        updateRes === 'gopaymidtrans'
      ) {
        // Anggap sukses, lanjutkan proses pembayaran
      } else if (updateRes.result !== 'success') {
        Alert.alert(
          'Error',
          updateRes.message || 'Gagal update metode pembayaran',
        );
        return;
      }

      const payload = {
        invoiceid: invoice.id,
      };

      const response = await fetch(
        'https://portal.relabs.id/danaxendit/payNow',
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        console.log('Status error:', response.status, text);
        Alert.alert('Error', `Status: ${response.status}\n${text}`);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.log('Gagal parse JSON:', text);
        Alert.alert('Error', 'Response bukan JSON: ' + text);
        return;
      }

      console.log('Response dari backend:', data);

      if (data.result === 'success' && data.redirect_url) {
        Linking.openURL(data.redirect_url);
      } else {
        Alert.alert(
          'Gagal',
          data.message || 'Gagal mendapatkan link pembayaran',
        );
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran');
    }
  };

  // Fungsi untuk handle klik Pay Now Gopay
  const handleGopayPayNow = async () => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke Gopay
      const updateRes = await updatePaymentMethod(invoice.id, 'gopaymidtrans');
      if (
        (typeof updateRes === 'string' &&
          updateRes.toLowerCase().includes('gopay')) ||
        (updateRes.result && updateRes.result === 'success')
      ) {
        // Sukses update, buka halaman invoice web
        const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Gagal update metode pembayaran ke Gopay');
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran.');
    }
  };

  const handleOvoPayNow = async () => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke OVO
      const updateRes = await updatePaymentMethod(invoice.id, 'ovoxendit');
      if (
        (typeof updateRes === 'string' &&
          updateRes.toLowerCase().includes('ovo')) ||
        (updateRes.result && updateRes.result === 'success')
      ) {
        // Setelah update berhasil, buka halaman invoice web
        const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Gagal update metode pembayaran ke OVO');
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran.');
    }
  };

  const handleShopeepayPayNow = async () => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke ShopeePay
      const updateRes = await updatePaymentMethod(
        invoice.id,
        'shopeepayxendit',
      );
      if (
        (typeof updateRes === 'string' &&
          updateRes.toLowerCase().includes('shopeepay')) ||
        (updateRes.result && updateRes.result === 'success')
      ) {
        // Setelah update berhasil, buka halaman invoice web
        const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Gagal update metode pembayaran ke ShopeePay');
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran.');
    }
  };

  const handleLinkajaPayNow = async () => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke LinkAja
      const updateRes = await updatePaymentMethod(invoice.id, 'linkajaxendit');
      console.log('Update Payment Method Response:', updateRes);

      if (
        updateRes === 'LINKAJA' ||
        updateRes === 'linkajaxendit' ||
        (typeof updateRes === 'string' &&
          updateRes.toLowerCase().includes('linkaja')) ||
        (updateRes.result && updateRes.result === 'success')
      ) {
        // Setelah update berhasil, buka halaman invoice web
        const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Gagal update metode pembayaran ke LinkAja');
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran.');
    }
  };

  const handleVAPayNow = async (vaType: string) => {
    try {
      const invoiceStr = await AsyncStorage.getItem('currentInvoice');
      const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
      if (!invoice || !invoice.id) {
        Alert.alert('Error', 'Invoice tidak ditemukan');
        return;
      }

      // Update payment method ke VA yang dipilih
      const updateRes = await updatePaymentMethod(invoice.id, vaType);
      console.log('Update Payment Method Response:', updateRes);

      if (
        updateRes === vaType.toUpperCase() ||
        updateRes === vaType.toLowerCase() ||
        (typeof updateRes === 'string' &&
          updateRes.toLowerCase().includes(vaType.toLowerCase())) ||
        (updateRes.result && updateRes.result === 'success')
      ) {
        // Setelah update berhasil, buka halaman invoice web
        const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
        Linking.openURL(url);
      } else {
        Alert.alert('Error', `Gagal update metode pembayaran ke ${vaType}`);
      }
    } catch (err) {
      console.log('Error:', err);
      Alert.alert('Error', 'Terjadi kesalahan saat proses pembayaran.');
    }
  };

  const updatePaymentMethod = async (
    invoiceId: string | number,
    paymentMethod: string,
  ) => {
    const payload = {
      id: invoiceId,
      paymentmethod: paymentMethod,
    };

    const response = await fetch(
      'https://portal.relabs.id/billinginfo/updatepayment',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      },
    );

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text(); // return string
    }
    console.log('Update Payment Method Response:', data);
    return data;
  };

  // const getCsrfToken = async () => {
  //   // Implementasi untuk mendapatkan CSRF token dari backend
  //   // Ini adalah contoh sederhana, Anda mungkin perlu mengimplementasikan logika yang sesuai
  //   // untuk mendapatkan CSRF token dari backend.
  //   return 'dummy_csrf_token'; // Ganti dengan logika yang sesuai
  // };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#00008B" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fd7e14" />
          <Text style={styles.loadingText}>Memuat instruksi pembayaran...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#00008B" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#00008B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={handleBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instruksi Pembayaran</Text>
      </View>

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
        <View style={styles.content}>
          {/* Payment Gateway Information */}
          <View style={styles.gatewayCard}>
            <Text style={styles.gatewayName}>
              {selectedGateway?.name || 'Metode Pembayaran'}
            </Text>

            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceLabel}>Total Tagihan</Text>
              <Text style={styles.invoiceAmount}>
                Rp {totalAmount.toLocaleString('id-ID')}
              </Text>
            </View>

            {virtualAccountNumber && (
              <View style={styles.vaNumberContainer}>
                <Text style={styles.vaLabel}>Nomor Virtual Account</Text>
                <Text style={styles.vaNumber}>{virtualAccountNumber}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    Clipboard.setString(virtualAccountNumber);
                    Alert.alert('Berhasil', 'Nomor VA disalin ke clipboard');
                  }}>
                  <Text style={styles.copyButtonText}>Salin</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Cara Pembayaran</Text>
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {formatInstructions(paymentInstructions)}
              </Text>
            </View>
          </View>

          {/* Footer Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handlePaymentComplete}>
            <Text style={styles.confirmButtonText}>Saya Sudah Bayar</Text>
          </TouchableOpacity>

          {/* Tampilkan tombol hanya jika gateway DANA/danaxendit atau Gopay atau OVO atau ShopeePay atau LinkAja atau VA */}
          {selectedGateway &&
            selectedGateway.name &&
            (selectedGateway.name.toLowerCase().includes('dana') ? (
              <TouchableOpacity
                onPress={handlePayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('gopay') ? (
              <TouchableOpacity
                onPress={handleGopayPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('ovo') ? (
              <TouchableOpacity
                onPress={handleOvoPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('shopeepay') ? (
              <TouchableOpacity
                onPress={handleShopeepayPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('linkaja') ? (
              <TouchableOpacity
                onPress={handleLinkajaPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('bni') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('bnivaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('sampoerna') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('sampoernavaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('bri') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('brivaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('mandiri') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('mandirivaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('bca') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('bcavaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('cimb') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('cimbvaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('permatabank') ? (
              <TouchableOpacity
                onPress={() => handleVAPayNow('permatabankvaxendit')}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
            ) : null)}
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
        {/* <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('PaymentSuccess')}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navText}>Buy</Text>
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Pay')}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
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
  header: {
    backgroundColor: '#fd7e14',
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  backButtonHeader: {
    marginRight: 10,
  },
  backIcon: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#f0f0f0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  gatewayCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gatewayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  invoiceDetails: {
    marginVertical: 10,
  },
  invoiceLabel: {
    fontSize: 14,
    color: '#666',
  },
  invoiceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fd7e14',
    marginTop: 5,
  },
  vaNumberContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  vaLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  vaNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  copyButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#fd7e14',
    padding: 6,
    borderRadius: 4,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#fd7e14',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  payNowButton: {
    backgroundColor: 'orange',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentInstructionsScreen;
