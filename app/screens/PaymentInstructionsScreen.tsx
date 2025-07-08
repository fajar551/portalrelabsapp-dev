import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Dimensions,
  Linking,
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
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'va' | 'bank' | 'other'>('other');

  // Helper functions untuk style dinamis
  const getScrollViewStyle = () => {
    return [styles.scrollView, {paddingBottom: 80 + insets.bottom}];
  };

  const getInvoiceRowStyle = () => {
    return {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    };
  };

  const getCopyButtonWithMarginStyle = () => {
    return [styles.copyButton, {marginLeft: 16}];
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

  const getActiveNavTextStyle = () => {
    return [styles.navText, styles.activeNavText];
  };

  const getModalButtonStyle = (isCancel: boolean) => {
    return [
      styles.modalButton,
      isCancel ? styles.modalButtonCancel : styles.modalButtonConfirm,
    ];
  };

  const getCopyButtonFullWidthStyle = () => {
    return [styles.copyButton, styles.copyButtonFullWidth];
  };

  const ensureVACreated = useCallback(
    async (invoiceId: string | number, vaType: string) => {
      try {
        // Khusus untuk Sampoerna VA, gunakan format yang berbeda
        const paymentMethod =
          vaType === 'sahabat_sampoerna' ? 'sahabat_sampoerna' : vaType;

        // Hit endpoint untuk membuat VA
        const response = await fetch(
          'https://portal.relabs.id/billinginfo/updatepayment',
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: invoiceId,
              paymentmethod: paymentMethod,
            }),
          },
        );

        const data = await response.json();
        console.log('VA Creation Response:', data);

        // Tunggu 3 detik untuk memastikan VA sudah dibuat di server
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Ambil detail invoice untuk memastikan VA sudah dibuat
        const invoiceDetails = await getInvoiceById(invoiceId);
        console.log(
          'Invoice Details after VA creation:',
          JSON.stringify(invoiceDetails),
        );

        // Cek VA di payment_info
        if (invoiceDetails?.payment_info) {
          // Khusus untuk Sampoerna VA
          if (vaType === 'sahabat_sampoerna') {
            // Cek di available_payment_methods untuk Sampoerna VA
            if (invoiceDetails.payment_info.available_payment_methods) {
              const sampoernaMethod =
                invoiceDetails.payment_info.available_payment_methods.find(
                  (method: any) => {
                    const methodGateway = method.gateway?.toLowerCase() || '';
                    return (
                      methodGateway.includes('sahabat_sampoerna') ||
                      methodGateway.includes('sampoerna')
                    );
                  },
                );

              if (sampoernaMethod?.va_number) {
                setVirtualAccountNumber(sampoernaMethod.va_number);
                return data;
              }
            }

            // Jika tidak ditemukan di available_payment_methods, cek di payment_info utama
            const vaNumber =
              invoiceDetails.payment_info.va_number ||
              invoiceDetails.payment_info.virtual_account_number ||
              invoiceDetails.payment_info.account_number;

            if (vaNumber) {
              setVirtualAccountNumber(vaNumber);
              return data;
            }
          } else {
            // Untuk VA lainnya
            const vaNumber =
              invoiceDetails.payment_info.va_number ||
              invoiceDetails.payment_info.virtual_account_number ||
              invoiceDetails.payment_info.account_number;

            if (vaNumber) {
              setVirtualAccountNumber(vaNumber);
              return data;
            }
          }
        }

        return data;
      } catch (err) {
        console.error('Error creating VA:', err);
        throw err;
      }
    },
    [],
  );

  const updatePaymentMethod = useCallback(
    async (invoiceId: string | number, paymentMethod: string) => {
      try {
        // Pastikan VA dibuat terlebih dahulu
        const vaCreationResult = await ensureVACreated(
          invoiceId,
          paymentMethod,
        );
        console.log('VA Creation Result:', vaCreationResult);

        // Jika VA sudah berhasil dibuat, tidak perlu update payment method lagi
        if (virtualAccountNumber) {
          return vaCreationResult;
        }

        // Khusus untuk Sampoerna VA, gunakan format yang berbeda
        const finalPaymentMethod =
          paymentMethod === 'sahabat_sampoerna'
            ? 'sahabat_sampoerna'
            : paymentMethod;

        const payload = {
          id: invoiceId,
          paymentmethod: finalPaymentMethod,
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

        // Jika update berhasil, langsung ambil detail invoice terbaru
        if (
          data === paymentMethod.toUpperCase() ||
          data === paymentMethod.toLowerCase() ||
          (typeof data === 'object' && data.result === 'success')
        ) {
          // Tunggu 3 detik untuk memastikan data sudah diupdate di server
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Ambil detail invoice terbaru
          const invoiceDetails = await getInvoiceById(invoiceId);
          console.log(
            'Latest Invoice Details after update:',
            JSON.stringify(invoiceDetails),
          );

          // Cek VA di payment_info
          if (invoiceDetails?.payment_info) {
            // Khusus untuk Sampoerna VA
            if (paymentMethod === 'sahabat_sampoerna') {
              // Cek di available_payment_methods untuk Sampoerna VA
              if (invoiceDetails.payment_info.available_payment_methods) {
                const sampoernaMethod =
                  invoiceDetails.payment_info.available_payment_methods.find(
                    (method: any) => {
                      const methodGateway = method.gateway?.toLowerCase() || '';
                      return (
                        methodGateway.includes('sahabat_sampoerna') ||
                        methodGateway.includes('sampoerna')
                      );
                    },
                  );

                if (sampoernaMethod?.va_number) {
                  setVirtualAccountNumber(sampoernaMethod.va_number);
                  return data;
                }
              }

              // Jika tidak ditemukan di available_payment_methods, cek di payment_info utama
              const vaNumber =
                invoiceDetails.payment_info.va_number ||
                invoiceDetails.payment_info.virtual_account_number ||
                invoiceDetails.payment_info.account_number;

              if (vaNumber) {
                setVirtualAccountNumber(vaNumber);
                return data;
              }
            } else {
              // Untuk VA lainnya
              const vaNumber =
                invoiceDetails.payment_info.va_number ||
                invoiceDetails.payment_info.virtual_account_number ||
                invoiceDetails.payment_info.account_number;

              if (vaNumber) {
                setVirtualAccountNumber(vaNumber);
                return data;
              }
            }
          }
        }

        return data;
      } catch (err) {
        console.error('Error in updatePaymentMethod:', err);
        throw err;
      }
    },
    [ensureVACreated, virtualAccountNumber],
  );

  const redirectToWebInvoice = useCallback(
    async (invoiceId: string | number, paymentMethod: string) => {
      try {
        // Update payment method terlebih dahulu
        await updatePaymentMethod(invoiceId, paymentMethod);

        // Buka halaman invoice di website
        const url = `https://portal.relabs.id/billing/invoices/view/${invoiceId}`;
        await Linking.openURL(url);
      } catch (err) {
        console.error('Error redirecting to web invoice:', err);
        Alert.alert('Error', 'Gagal membuka halaman invoice');
      }
    },
    [updatePaymentMethod],
  );

  const loadData = useCallback(async () => {
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
              let vaType = '';

              // Tentukan VA type berdasarkan gateway yang dipilih
              if (selectedGatewayName.includes('bca')) {
                vaType = 'bcavaxendit';
              } else if (selectedGatewayName.includes('bni')) {
                vaType = 'bnivaxendit';
              } else if (selectedGatewayName.includes('sampoerna')) {
                vaType = 'sahabat_sampoerna'; // Ubah format untuk Sampoerna
              } else if (selectedGatewayName.includes('bri')) {
                vaType = 'brivaxendit';
              } else if (selectedGatewayName.includes('mandiri')) {
                vaType = 'mandirivaxendit';
              } else if (selectedGatewayName.includes('cimb')) {
                vaType = 'cimbvaxendit';
              } else if (selectedGatewayName.includes('permatabank')) {
                vaType = 'permatabankvaxendit';
              }

              // Jika gateway adalah VA, langsung lakukan update payment method
              if (vaType) {
                console.log('Processing VA type:', vaType);
                try {
                  // Update payment method
                  const methodUpdateRes = await updatePaymentMethod(
                    invoice.id,
                    vaType,
                  );
                  console.log(
                    'Update Payment Method Response:',
                    methodUpdateRes,
                  );

                  // Tunggu 3 detik untuk memastikan VA sudah diupdate di server
                  await new Promise(resolve => setTimeout(resolve, 3000));

                  // Setelah update berhasil, ambil detail invoice lagi untuk mendapatkan VA yang baru
                  const updatedInvoiceDetails = await getInvoiceById(
                    invoice.id,
                  );
                  console.log(
                    'Updated Invoice Details:',
                    JSON.stringify(updatedInvoiceDetails),
                  );

                  if (
                    updatedInvoiceDetails &&
                    updatedInvoiceDetails.payment_info
                  ) {
                    // Cek available_payment_methods untuk mendapatkan VA yang sesuai
                    let vaNumber = '';

                    if (
                      updatedInvoiceDetails.payment_info
                        .available_payment_methods
                    ) {
                      console.log(
                        'Available payment methods:',
                        JSON.stringify(
                          updatedInvoiceDetails.payment_info
                            .available_payment_methods,
                        ),
                      );
                      // Cari metode pembayaran yang sesuai dengan vaType
                      const matchingMethod =
                        updatedInvoiceDetails.payment_info.available_payment_methods.find(
                          (method: any) => {
                            const methodGateway =
                              method.gateway?.toLowerCase() || '';
                            console.log(
                              'Checking method gateway:',
                              methodGateway,
                              'against vaType:',
                              vaType,
                            );
                            // Khusus untuk Sampoerna VA
                            if (vaType === 'sahabat_sampoerna') {
                              return (
                                methodGateway.includes('sahabat_sampoerna') ||
                                methodGateway.includes('sampoerna')
                              );
                            }
                            return methodGateway.includes(
                              vaType.toLowerCase().replace('xendit', ''),
                            );
                          },
                        );

                      if (matchingMethod && matchingMethod.va_number) {
                        vaNumber = matchingMethod.va_number;
                        console.log(
                          'Found matching VA:',
                          vaNumber,
                          'for gateway:',
                          matchingMethod.gateway,
                        );
                      } else {
                        console.log(
                          'No matching VA found in available_payment_methods',
                        );
                      }
                    }

                    // Jika tidak ditemukan di available_payment_methods, coba ambil dari payment_info utama
                    if (!vaNumber) {
                      vaNumber =
                        updatedInvoiceDetails.payment_info.va_number ||
                        updatedInvoiceDetails.payment_info
                          .virtual_account_number ||
                        updatedInvoiceDetails.payment_info.account_number ||
                        '';
                      console.log(
                        'Trying to get VA from payment_info:',
                        vaNumber,
                      );
                    }

                    console.log('Selected VA Number:', vaNumber);

                    if (vaNumber) {
                      setVirtualAccountNumber(vaNumber);
                    } else {
                      // Jika VA belum tersedia, tampilkan pesan
                      setVirtualAccountNumber(
                        'Nomor VA sedang diproses. Silakan tunggu...',
                      );

                      // Fungsi untuk retry mengambil VA dengan maksimal 3 kali percobaan
                      const retryGetVA = async (retryCount = 0) => {
                        try {
                          // Panggil updatePaymentMethod lagi untuk memastikan VA dibuat
                          const retryUpdateRes = await updatePaymentMethod(
                            invoice.id,
                            vaType,
                          );
                          console.log(
                            'Retry update payment method:',
                            retryUpdateRes,
                          );

                          const retryInvoiceDetails = await getInvoiceById(
                            invoice.id,
                          );
                          console.log(
                            'Retry attempt',
                            retryCount + 1,
                            ':',
                            JSON.stringify(retryInvoiceDetails),
                          );

                          // Cek di available_payment_methods terlebih dahulu
                          let retryVaNumber = '';
                          if (
                            retryInvoiceDetails?.payment_info
                              ?.available_payment_methods
                          ) {
                            const retryMatchingMethod =
                              retryInvoiceDetails.payment_info.available_payment_methods.find(
                                (method: any) => {
                                  const methodGateway =
                                    method.gateway?.toLowerCase() || '';
                                  // Khusus untuk Sampoerna VA
                                  if (vaType === 'sahabat_sampoerna') {
                                    return (
                                      methodGateway.includes(
                                        'sahabat_sampoerna',
                                      ) || methodGateway.includes('sampoerna')
                                    );
                                  }
                                  return methodGateway.includes(
                                    vaType.toLowerCase().replace('xendit', ''),
                                  );
                                },
                              );
                            if (retryMatchingMethod?.va_number) {
                              retryVaNumber = retryMatchingMethod.va_number;
                            }
                          }

                          // Jika tidak ada di available_payment_methods, cek di payment_info
                          if (!retryVaNumber) {
                            retryVaNumber =
                              retryInvoiceDetails?.payment_info?.va_number ||
                              retryInvoiceDetails?.payment_info
                                ?.virtual_account_number ||
                              retryInvoiceDetails?.payment_info
                                ?.account_number ||
                              '';
                          }

                          if (retryVaNumber) {
                            setVirtualAccountNumber(retryVaNumber);
                            return;
                          }

                          // Jika masih belum ada VA dan belum mencapai maksimal retry (3 kali)
                          if (retryCount < 2) {
                            // Tunggu 3 detik sebelum retry berikutnya
                            setTimeout(() => retryGetVA(retryCount + 1), 3000);
                          } else {
                            // Jika sudah mencapai maksimal retry (3 kali) dan masih belum ada VA
                            Alert.alert(
                              'VA Belum Tersedia',
                              'Nomor VA belum tersedia setelah 3 kali percobaan. Apakah Anda ingin membuka halaman invoice di website?',
                              [
                                {
                                  text: 'Tidak',
                                  style: 'cancel',
                                  onPress: () => {
                                    setVirtualAccountNumber(
                                      'Nomor VA belum tersedia. Silakan coba beberapa saat lagi.',
                                    );
                                  },
                                },
                                {
                                  text: 'Buka di Website',
                                  onPress: () => {
                                    redirectToWebInvoice(invoice.id, vaType);
                                  },
                                },
                              ],
                            );
                          }
                        } catch (err) {
                          console.error('Error retrying VA fetch:', err);
                          if (retryCount < 2) {
                            setTimeout(() => retryGetVA(retryCount + 1), 3000);
                          }
                        }
                      };

                      // Mulai retry setelah 3 detik
                      setTimeout(() => retryGetVA(), 3000);
                    }
                  }
                } catch (err) {
                  console.error('Error updating payment method:', err);
                  setVirtualAccountNumber(
                    'Gagal memperbarui metode pembayaran. Silakan coba lagi.',
                  );
                }
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
  }, [updatePaymentMethod, redirectToWebInvoice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Format instruksi dengan nomor VA
  const formatInstructions = (instructions: string) => {
    if (!instructions) {
      return (
        <Text style={styles.instructionsText}>
          Tidak ada instruksi tersedia.
        </Text>
      );
    }

    // Hapus semua tag HTML dari instruksi
    instructions = instructions.replace(/<\/?[^>]+(>|$)/g, '');

    if (selectedGateway?.name?.toLowerCase().includes('bca bank transfer')) {
      return (
        <Text style={styles.instructionsText}>
          <Text>Bank: BCA{'\n'}</Text>
          <Text>Nomor Rekening: 037-8770800{'\n'}</Text>
          <Text>Nama Rekening: RELABS NET DAYACIPTA PT{'\n'}</Text>
          {'\n'}
          <Text>Silahkan konfirmasi bukti pembayaran ke{'\n'}</Text>
          <Text
            style={[styles.fwBold, styles.whatsappLink]}
            onPress={() => {
              const phoneNumber = '081992771888';
              const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
              Linking.canOpenURL(whatsappUrl).then(supported => {
                if (supported) {
                  Linking.openURL(whatsappUrl);
                } else {
                  // Fallback ke browser jika WhatsApp tidak terinstall
                  const webWhatsappUrl = `https://api.whatsapp.com/send/?phone=62${phoneNumber.substring(
                    1,
                  )}&text&type=phone_number&app_absent=0`;
                  Linking.openURL(webWhatsappUrl);
                }
              });
            }}>
            0819 9277 1888
          </Text>
        </Text>
      );
    }

    if (
      selectedGateway?.name
        ?.toLowerCase()
        .replace(/\s+/g, '')
        .includes('atmbersama') &&
      virtualAccountNumber
    ) {
      return (
        <Text style={styles.instructionsText}>
          Silahkan melakukan pembayaran ke ATM Bersama dengan menekan tombol
          Bayar Sekarang dibawah
        </Text>
      );
    }

    if (
      selectedGateway?.name?.toLowerCase().includes('va') &&
      !selectedGateway?.name
        ?.toLowerCase()
        .replace(/\s+/g, '')
        .includes('atmbersama') &&
      virtualAccountNumber
    ) {
      return (
        <Text style={styles.instructionsText}>
          {`Silahkan melakukan pembayaran ke nomor Virtual Account Anda berikut:\n\n${virtualAccountNumber}`}
        </Text>
      );
    }

    return (
      <Text style={styles.instructionsText}>
        Silahkan menekan tombol Pay Now di bawah, untuk melakukan pembayaran
      </Text>
    );
  };

  // Handle kembali ke halaman Pay
  const handleBack = () => {
    navigateTo('Pay');
  };

  // Handle pembayaran selesai
  const handlePaymentComplete = () => {
    // Cek apakah metode pembayaran adalah VA
    const isVA =
      selectedGateway?.name?.toLowerCase().includes('va') &&
      !selectedGateway?.name
        ?.toLowerCase()
        .replace(/\s+/g, '')
        .includes('atmbersama');

    if (selectedGateway?.name?.toLowerCase().includes('bank transfer')) {
      setModalType('bank');
      setModalMessage(
        'Silahkan konfirmasi bukti pembayaran ke  0819 9277 1888',
      );
      setShowModal(true);
    } else if (isVA) {
      setModalType('va');
      setModalMessage(
        'Silakan menunggu sekitar 5-10 menit untuk status berubah menjadi Sudah Dibayar',
      );
      setShowModal(true);
    } else {
      setModalType('other');
      setModalMessage('Apakah Anda sudah melakukan pembayaran?');
      setShowModal(true);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigateTo('Pay');
  };

  const handleModalCancel = () => {
    setShowModal(false);
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

  const handleVAPayNow = async () => {
    if (!_invoiceData?.id) {
      Alert.alert('Error', 'Invoice ID tidak ditemukan');
      return;
    }

    try {
      // Update payment method terlebih dahulu
      await updatePaymentMethod(_invoiceData.id, 'bni');

      // Buka halaman invoice di website
      const url = `https://portal.relabs.id/billing/invoices/view/${_invoiceData.id}`;
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error in handleVAPayNow:', err);
      Alert.alert('Error', 'Gagal membuka halaman pembayaran');
    }
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
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor="#00008B" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#E4571B', '#F26522']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instruksi Pembayaran</Text>
      </LinearGradient>

      <ScrollView
        style={getScrollViewStyle()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F26522', '#E4571B']}
            tintColor="#F26522"
          />
        }>
        <View style={styles.content}>
          {/* Payment Gateway Information */}
          <View style={styles.gatewayCard}>
            <Text style={styles.gatewayName}>
              {selectedGateway?.name || 'Metode Pembayaran'}
            </Text>

            {/* ID Invoice - tampilkan seperti label dan value, tanpa card khusus */}
            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceLabel}>ID Invoice</Text>
              <View style={getInvoiceRowStyle()}>
                <Text style={styles.invoiceAmount}>
                  {_invoiceData?.id || '-'}
                </Text>
                <TouchableOpacity
                  style={getCopyButtonWithMarginStyle()}
                  onPress={() => {
                    if (_invoiceData?.id) {
                      Clipboard.setString(String(_invoiceData.id));
                      Alert.alert(
                        'Berhasil',
                        'ID Invoice disalin ke clipboard',
                      );
                    }
                  }}>
                  <Icon name="content-copy" size={16} color="#fff" />
                  <Text style={styles.copyButtonText}> Salin</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Tagihan Card - seperti Invoice ID Card, diletakkan di atas */}
            <View style={styles.invoiceIdCard}>
              <View style={styles.invoiceIdHeader}>
                <Icon name="payments" size={20} color="#666" />
                <Text style={styles.invoiceIdLabel}>Total Tagihan</Text>
              </View>
              <View style={styles.invoiceIdContent}>
                <Text style={styles.invoiceIdValue}>
                  Rp. {totalAmount.toLocaleString('id-ID')}
                </Text>
                <TouchableOpacity
                  style={getCopyButtonWithMarginStyle()}
                  onPress={() => {
                    const totalStr = totalAmount.toLocaleString('id-ID');
                    Clipboard.setString(totalStr);
                    Alert.alert(
                      'Berhasil',
                      'Total tagihan disalin ke clipboard',
                    );
                  }}>
                  <Icon name="content-copy" size={16} color="#fff" />
                  <Text style={styles.copyButtonText}> Salin</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tampilkan VA untuk metode pembayaran VA lainnya */}
            {selectedGateway?.name?.toLowerCase().includes('va') &&
              !selectedGateway?.name
                ?.toLowerCase()
                .replace(/\s+/g, '')
                .includes('atmbersama') &&
              virtualAccountNumber && (
                <View style={styles.vaNumberContainer}>
                  <Text style={styles.vaLabel}>Nomor Virtual Account</Text>
                  <Text style={styles.vaNumber}>{virtualAccountNumber}</Text>
                  <TouchableOpacity
                    style={getCopyButtonFullWidthStyle()}
                    onPress={() => {
                      Clipboard.setString(String(virtualAccountNumber));
                      Alert.alert('Berhasil', 'Nomor VA disalin ke clipboard');
                    }}>
                    <Icon name="content-copy" size={16} color="#fff" />
                    <Text style={styles.copyButtonText}> Salin</Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Cara Pembayaran</Text>
            <View style={styles.instructionsContainer}>
              {formatInstructions(paymentInstructions)}
            </View>
          </View>

          {/* Footer Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handlePaymentComplete}>
            <Text style={styles.confirmButtonText}>Saya Sudah Bayar</Text>
          </TouchableOpacity>

          {/* Tampilkan tombol hanya jika gateway DANA/danaxendit atau Gopay atau OVO atau ShopeePay atau LinkAja atau ATM Bersama atau Alfamart atau Cash Payment atau Credit Card */}
          {selectedGateway &&
            selectedGateway.name &&
            (selectedGateway.name.toLowerCase().includes('dana') ? (
              <TouchableOpacity
                onPress={handlePayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('gopay') ? (
              <TouchableOpacity
                onPress={handleGopayPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('ovo') ? (
              <TouchableOpacity
                onPress={handleOvoPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('shopeepay') ? (
              <TouchableOpacity
                onPress={handleShopeepayPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('linkaja') ? (
              <TouchableOpacity
                onPress={handleLinkajaPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name
                .toLowerCase()
                .replace(/\s+/g, '')
                .includes('atmbersama') ? (
              <TouchableOpacity
                onPress={handleVAPayNow}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('alfamart') ? (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const invoiceStr = await AsyncStorage.getItem(
                      'currentInvoice',
                    );
                    const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
                    if (!invoice || !invoice.id) {
                      Alert.alert('Error', 'Invoice tidak ditemukan');
                      return;
                    }

                    // Update payment method ke Alfamart
                    const updateRes = await updatePaymentMethod(
                      invoice.id,
                      'alfamartxendit',
                    );
                    console.log('Update Payment Method Response:', updateRes);

                    // Cek response untuk Alfamart
                    if (
                      updateRes === 'ALFAMART' ||
                      updateRes === 'Alfamart' ||
                      updateRes === 'alfamartxendit' ||
                      (typeof updateRes === 'string' &&
                        (updateRes.toLowerCase().includes('alfamart') ||
                          updateRes
                            .toLowerCase()
                            .includes('alfamartxendit'))) ||
                      (updateRes.result && updateRes.result === 'success') ||
                      (typeof updateRes === 'object' && updateRes.success) ||
                      (typeof updateRes === 'object' &&
                        updateRes.status === 'success')
                    ) {
                      // Setelah update berhasil, buka halaman invoice web
                      const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
                      Linking.openURL(url);
                    } else {
                      console.log('Response tidak sesuai:', updateRes);
                      Alert.alert(
                        'Error',
                        'Gagal update metode pembayaran ke Alfamart',
                      );
                    }
                  } catch (err) {
                    console.log('Error:', err);
                    Alert.alert(
                      'Error',
                      'Terjadi kesalahan saat proses pembayaran.',
                    );
                  }
                }}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('cash payment') ? (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const invoiceStr = await AsyncStorage.getItem(
                      'currentInvoice',
                    );
                    const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
                    if (!invoice || !invoice.id) {
                      Alert.alert('Error', 'Invoice tidak ditemukan');
                      return;
                    }

                    // Update payment method ke Cash Payment
                    const updateRes = await updatePaymentMethod(
                      invoice.id,
                      'cashpayment',
                    );
                    console.log('Update Payment Method Response:', updateRes);

                    // Cek response untuk Cash Payment
                    if (
                      updateRes === 'CASH PAYMENT' ||
                      updateRes === 'Cash Payment' ||
                      updateRes === 'cashpayment' ||
                      (typeof updateRes === 'string' &&
                        (updateRes.toLowerCase().includes('cashpayment') ||
                          updateRes.toLowerCase().includes('cash payment'))) ||
                      (updateRes.result && updateRes.result === 'success') ||
                      (typeof updateRes === 'object' && updateRes.success) ||
                      (typeof updateRes === 'object' &&
                        updateRes.status === 'success')
                    ) {
                      // Setelah update berhasil, buka halaman invoice web
                      const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
                      Linking.openURL(url);
                    } else {
                      console.log('Response tidak sesuai:', updateRes);
                      Alert.alert(
                        'Error',
                        'Gagal update metode pembayaran ke Cash Payment',
                      );
                    }
                  } catch (err) {
                    console.log('Error:', err);
                    Alert.alert(
                      'Error',
                      'Terjadi kesalahan saat proses pembayaran.',
                    );
                  }
                }}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : selectedGateway.name.toLowerCase().includes('credit card') ||
              selectedGateway.name.toLowerCase().includes('visa') ||
              selectedGateway.name.toLowerCase().includes('mastercard') ||
              selectedGateway.name.toLowerCase().includes('jbc') ||
              selectedGateway.name
                .toLowerCase()
                .includes('american express') ? (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const invoiceStr = await AsyncStorage.getItem(
                      'currentInvoice',
                    );
                    const invoice = invoiceStr ? JSON.parse(invoiceStr) : null;
                    if (!invoice || !invoice.id) {
                      Alert.alert('Error', 'Invoice tidak ditemukan');
                      return;
                    }

                    // Update payment method ke Credit Card
                    const updateRes = await updatePaymentMethod(
                      invoice.id,
                      'ccmidtrans',
                    );
                    console.log('Update Payment Method Response:', updateRes);

                    // Cek response untuk Credit Card
                    if (
                      updateRes === 'CREDIT CARD' ||
                      updateRes === 'Credit Card' ||
                      updateRes === 'ccmidtrans' ||
                      (typeof updateRes === 'string' &&
                        (updateRes.toLowerCase().includes('credit card') ||
                          updateRes.toLowerCase().includes('ccmidtrans') ||
                          updateRes.toLowerCase().includes('visa') ||
                          updateRes.toLowerCase().includes('mastercard') ||
                          updateRes.toLowerCase().includes('jbc') ||
                          updateRes
                            .toLowerCase()
                            .includes('american express'))) ||
                      (updateRes.result && updateRes.result === 'success') ||
                      (typeof updateRes === 'object' && updateRes.success) ||
                      (typeof updateRes === 'object' &&
                        updateRes.status === 'success')
                    ) {
                      // Setelah update berhasil, buka halaman invoice web
                      const url = `https://portal.relabs.id/billinginfo/viewinvoice/web/${invoice.id}`;
                      Linking.openURL(url);
                    } else {
                      console.log('Response tidak sesuai:', updateRes);
                      Alert.alert(
                        'Error',
                        'Gagal update metode pembayaran ke Credit Card',
                      );
                    }
                  } catch (err) {
                    console.log('Error:', err);
                    Alert.alert(
                      'Error',
                      'Terjadi kesalahan saat proses pembayaran.',
                    );
                  }
                }}
                style={styles.payNowButton}>
                <Text style={styles.payNowButtonText}>Bayar Sekarang</Text>
              </TouchableOpacity>
            ) : null)}
        </View>
        <View style={getSpacerStyle()} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={getBottomNavStyle()}>
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
            colors={['#E4571B', '#F26522']}
            // colors={['#ffb347', '#fd7e14']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.navIconContainer}>
            <Icon name="receipt" size={24} color="#fff" />
          </LinearGradient>
          <Text style={getActiveNavTextStyle()}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Help')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="help" size={24} color="#666" />
          </View>
          <Text style={styles.navText}>Bantuan</Text>
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

      {/* Custom Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konfirmasi Pembayaran</Text>
            </View>
            <View style={styles.modalContent}>
              {modalType === 'va' && (
                <View style={styles.modalIconContainer}>
                  <Icon name="access-time" size={50} color="#fd7e14" />
                </View>
              )}
              {modalType === 'bank' && (
                <View style={styles.modalIconContainer}>
                  <Icon name="phone" size={50} color="#fd7e14" />
                </View>
              )}
              {modalType === 'other' && (
                <View style={styles.modalIconContainer}>
                  <Icon name="payment" size={50} color="#fd7e14" />
                </View>
              )}
              {modalType === 'bank' ? (
                <Text style={styles.modalMessage}>
                  Silahkan konfirmasi bukti pembayaran ke{' '}
                  <Text
                    style={[styles.modalMessage, styles.whatsappLink]}
                    onPress={() => {
                      const phoneNumber = '081992771888';
                      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
                      Linking.canOpenURL(whatsappUrl).then(supported => {
                        if (supported) {
                          Linking.openURL(whatsappUrl);
                        } else {
                          // Fallback ke browser jika WhatsApp tidak terinstall
                          const webWhatsappUrl = `https://api.whatsapp.com/send/?phone=62${phoneNumber.substring(
                            1,
                          )}&text&type=phone_number&app_absent=0`;
                          Linking.openURL(webWhatsappUrl);
                        }
                      });
                    }}>
                    0819 9277 1888
                  </Text>
                </Text>
              ) : (
                <Text style={styles.modalMessage}>{modalMessage}</Text>
              )}
            </View>
            <View style={styles.modalButtonContainer}>
              {modalType === 'other' ? (
                <>
                  <TouchableOpacity
                    style={getModalButtonStyle(true)}
                    onPress={handleModalCancel}>
                    <Text style={styles.modalButtonTextCancel}>Belum</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={getModalButtonStyle(false)}
                    onPress={handleModalClose}>
                    <Text style={styles.modalButtonText}>Sudah</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={getModalButtonStyle(false)}
                  onPress={handleModalClose}>
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
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
  fwBold: {
    fontWeight: 'bold',
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
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 23,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  invoiceDetails: {
    marginVertical: 10,
  },
  invoiceLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  invoiceAmount: {
    fontSize: 22,
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
    fontWeight: '500',
    marginBottom: 5,
  },
  vaNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fd7e14',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 15,
    minWidth: 35,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
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
    backgroundColor: '#F26522',
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
    paddingTop: 5,
    paddingBottom: 4,
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
  boldText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.85,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonConfirm: {
    backgroundColor: '#fd7e14',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bankInfoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  bankInfoValue: {
    color: '#333',
    marginLeft: 4,
  },
  invoiceIdCard: {
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  invoiceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceIdLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
  },
  invoiceIdContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  invoiceIdValue: {
    fontSize: 20,
    color: '#F26522',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copyButtonFullWidth: {
    width: '100%',
    justifyContent: 'center',
    marginTop: 8,
  },
  whatsappLink: {
    color: '#25D366',
    textDecorationLine: 'underline',
  },
});

export default PaymentInstructionsScreen;
