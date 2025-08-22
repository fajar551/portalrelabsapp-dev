import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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
    invoiceId: null as number | null, // Tambahkan invoice ID
    invoiceNum: null as string | null, // Tambahkan invoice number
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
      duedate?: string; // Added duedate field
    }>
  >([]);

  const [refreshing, setRefreshing] = useState(false);
  const [filterMonthYear, setFilterMonthYear] = useState<string>('');
  const [monthYearOptions, setMonthYearOptions] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Tambahkan state untuk initial loading
  const [skeletonOpacity] = useState(new Animated.Value(0.3)); // Tambahkan animasi untuk skeleton

  const insets = useSafeAreaInsets();

  // Animasi skeleton loading
  useEffect(() => {
    if (isInitialLoading) {
      const animateSkeleton = () => {
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isInitialLoading) {
            animateSkeleton();
          }
        });
      };
      animateSkeleton();
    } else {
      skeletonOpacity.setValue(0.3);
    }
  }, [isInitialLoading, skeletonOpacity]);

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
    setError('');
    setIsInitialLoading(true); // Set loading state di awal
    try {
      // Mengambil data invoice untuk billing period
      const invoices = await getClientInvoices();
      console.log('=== DEBUG INVOICES ===');
      console.log('Raw invoices from API:', invoices);

      // Filter untuk mendapatkan invoice yang belum dibayar (Unpaid)
      const unpaidInvoices = invoices.filter(
        (invoice: any) =>
          invoice.status === 'Unpaid' || invoice.status === 'Belum Dibayar',
      );
      console.log('Unpaid invoices:', unpaidInvoices);

      // Get most recent unpaid invoice
      if (unpaidInvoices && unpaidInvoices.length > 0) {
        const latestUnpaidInvoice = unpaidInvoices[0]; // Ambil yang paling baru

        // Extract date and duedate from the invoice
        if (latestUnpaidInvoice.date && latestUnpaidInvoice.duedate) {
          setBillingPeriod({
            startDate: new Date(latestUnpaidInvoice.date),
            dueDate: new Date(latestUnpaidInvoice.duedate),
            amount: latestUnpaidInvoice.total || 0,
            invoiceId: latestUnpaidInvoice.id,
            invoiceNum: latestUnpaidInvoice.invoicenum,
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
            invoiceId: latestInvoice.id,
            invoiceNum: latestInvoice.invoicenum,
          });
        }
      } else {
        // Tidak ada invoice sama sekali
        setBillingPeriod({
          startDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          amount: 0,
          invoiceId: null,
          invoiceNum: null,
        });
      }

      // Mengambil data riwayat pembayaran dan semua invoice
      const payments = await getPaymentHistory();
      console.log('Raw payments from API:', payments);

      // Gabungkan data invoice dan payment history
      const allInvoicesData: Array<{
        id?: number;
        invoicenum?: string;
        month: string;
        year: number;
        amount: number;
        status: string;
        datepaid?: string;
        paymentmethod?: string;
        duedate?: string;
      }> = [];

      // LANGKAH 1: Tambahkan SEMUA invoice dari getClientInvoices (baik paid maupun unpaid)
      if (invoices && invoices.length > 0) {
        invoices.forEach((inv: any) => {
          console.log('Processing invoice:', {
            id: inv.id,
            invoicenum: inv.invoicenum,
            status: inv.status,
            total: inv.total,
            duedate: inv.duedate,
          });

          // Tambahkan semua invoice ke allInvoicesData dengan status asli dari API
          allInvoicesData.push({
            id: inv.id,
            invoicenum: inv.invoicenum,
            month: new Date(inv.duedate || inv.date).toLocaleString('id-ID', {
              month: 'long',
            }),
            year: new Date(inv.duedate || inv.date).getFullYear(),
            amount: inv.total || inv.amount || 0,
            status: inv.status || 'Unknown', // Gunakan status asli dari API
            duedate: inv.duedate,
            datepaid: inv.datepaid || null,
            paymentmethod: inv.paymentmethod || null,
          });
        });
      }

      // LANGKAH 2: Update data invoice yang sudah dibayar dengan informasi dari payment history
      if (payments && payments.length > 0) {
        // Mapping invoiceId ke payment details
        const paymentMap: Record<string, any> = {};
        payments.forEach((payment: any) => {
          if (payment.id) {
            paymentMap[payment.id] = payment;
          }
          if (payment.invoicenum) {
            paymentMap[payment.invoicenum] = payment;
          }
        });

        console.log('Payment map:', paymentMap);

        // Update invoice yang sudah ada dengan data pembayaran
        allInvoicesData.forEach((invoice, index) => {
          const invoiceId = invoice.id?.toString() || '';
          const invoiceNum = invoice.invoicenum?.toString() || '';
          const paymentDetail = paymentMap[invoiceId] || paymentMap[invoiceNum];

          if (paymentDetail) {
            // Update dengan informasi pembayaran
            allInvoicesData[index] = {
              ...invoice,
              status: paymentDetail.status || 'Paid',
              datepaid: paymentDetail.datepaid,
              paymentmethod: paymentDetail.paymentmethod,
              // Gunakan data dari payment jika tersedia
              month: paymentDetail.month || invoice.month,
              year: paymentDetail.year || invoice.year,
            };
            console.log(
              'Updated invoice with payment details:',
              allInvoicesData[index],
            );
          }
        });

        // Tambahkan payment yang tidak memiliki invoice terkait (jika ada)
        payments.forEach((payment: any) => {
          const existingInvoice = allInvoicesData.find(
            (inv: any) =>
              inv.id === payment.id || inv.invoicenum === payment.invoicenum,
          );

          if (!existingInvoice) {
            console.log('Adding orphan payment:', payment);
            allInvoicesData.push({
              id: payment.id,
              invoicenum: payment.invoicenum,
              month: payment.month,
              year: payment.year,
              amount: payment.amount,
              status: payment.status || 'Paid',
              duedate: undefined,
              datepaid: payment.datepaid,
              paymentmethod: payment.paymentmethod,
            });
          }
        });
      }

      console.log('Final combined data:', allInvoicesData);

      // Urutkan berdasarkan duedate (terbaru di atas)
      allInvoicesData.sort((a, b) => {
        const dateA = new Date(a.duedate || Date.now());
        const dateB = new Date(b.duedate || Date.now());
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Sorted final data:', allInvoicesData);
      console.log('=== END DEBUG ===');

      setPaymentHistory(allInvoicesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
      // Jika error, set billing amount ke 0 untuk menunjukkan tidak ada tagihan
      setBillingPeriod(prev => ({...prev, amount: 0}));
    } finally {
      setRefreshing(false);
      setIsInitialLoading(false); // Set loading state ke false setelah selesai
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

  // Fungsi untuk export PDF invoice berdasarkan ID
  const exportPDFInvoice = async (
    invoiceId: number | string,
    status?: string,
    selectedPayment?: any,
  ) => {
    console.log('=== EXPORT PDF DEBUG ===');
    console.log('Invoice ID:', invoiceId);
    console.log('Status:', status);
    console.log('Selected Payment:', selectedPayment);
    console.log('=== END EXPORT DEBUG ===');

    try {
      // Ambil token dari AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan. Silakan login kembali.');
        return;
      }

      // Buat URL dengan token autentikasi
      const pdfUrl = `https://portal.internetan.id/dl.php?type=i&id=${invoiceId}&token=${token}`;

      console.log('Exporting PDF with URL:', pdfUrl);

      // Coba buka URL dengan berbagai metode
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        // Jika tidak bisa dibuka langsung, coba dengan http/https
        const httpUrl = pdfUrl.replace('https://', 'http://');
        const httpSupported = await Linking.canOpenURL(httpUrl);
        if (httpSupported) {
          await Linking.openURL(httpUrl);
        } else {
          // Fallback: coba download PDF menggunakan fetch
          try {
            const response = await fetch(pdfUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/pdf',
              },
            });

            if (response.ok) {
              // Jika berhasil, buka dengan Linking lagi
              await Linking.openURL(pdfUrl);
            } else {
              throw new Error('PDF tidak dapat diakses');
            }
          } catch (fetchError) {
            // Fallback terakhir: tampilkan URL untuk copy-paste
            Alert.alert(
              'Export PDF',
              `Silakan copy URL berikut dan buka di browser:\n\n${pdfUrl}`,
              [{text: 'OK', style: 'cancel'}],
            );
          }
        }
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      Alert.alert(
        'Error',
        'Gagal mengexport PDF. Silakan coba lagi atau hubungi support.',
      );
    }
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
        // Urutkan gateways sesuai prioritas
        const sortedGateways = gateways.sort(
          (
            a: {
              id: number;
              name: string;
              description: string;
              instructions: string;
            },
            b: {
              id: number;
              name: string;
              description: string;
              instructions: string;
            },
          ) => {
            const priorityOrder = {
              bri: 1,
              briva: 1,
              brivaconventionalpayment: 1,
              brivaxendit: 1,
              bca: 2,
              bcava: 2,
              bcavaconventionalpayment: 2,
              bcavaxendit: 2,
              mandiri: 3,
              mandiriva: 3,
              mandirieconventionalpayment: 3,
              mandirivaxendit: 3,
              mandiriea: 3,
              qris: 4,
              ewallet: 4,
              gopay: 4,
              ovo: 4,
              dana: 4,
              shopeepay: 4,
              linkaja: 4,
              credit: 5,
              card: 5,
              visa: 5,
              mastercard: 5,
              jcb: 5,
            };

            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            // Cari prioritas berdasarkan nama gateway
            let aPriority = 999;
            let bPriority = 999;

            for (const [key, priority] of Object.entries(priorityOrder)) {
              if (aName.includes(key)) {
                aPriority = priority;
                break;
              }
            }

            for (const [key, priority] of Object.entries(priorityOrder)) {
              if (bName.includes(key)) {
                bPriority = priority;
                break;
              }
            }

            // Jika prioritas sama, urutkan berdasarkan nama
            if (aPriority === bPriority) {
              return aName.localeCompare(bName);
            }

            return aPriority - bPriority;
          },
        );

        setPaymentGateways(sortedGateways);
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

  // Ambil opsi bulan-tahun unik dari duedate invoice
  useEffect(() => {
    const fetchMonthYearOptions = async () => {
      if (isInitialLoading) {
        return;
      } // Skip jika masih loading awal

      try {
        const invoices = await getClientInvoices();
        // Ambil semua invoice (baik Paid maupun Unpaid)
        const paidInvoices = invoices.filter(
          (inv: any) =>
            inv.status === 'Paid' ||
            inv.status === 'Lunas' ||
            inv.status === 'Sudah Dibayar',
        );
        const unpaidInvoices = invoices.filter(
          (inv: any) =>
            inv.status === 'Unpaid' || inv.status === 'Belum Dibayar',
        );

        const allInvoices = [...paidInvoices, ...unpaidInvoices];
        const optionsSet = new Set<string>();
        allInvoices.forEach((inv: any) => {
          if (inv.duedate) {
            const date = new Date(inv.duedate);
            const month = date.toLocaleString('id-ID', {month: 'long'});
            const year = date.getFullYear();
            const monthYearString = `${month} ${year}`;
            optionsSet.add(monthYearString);
          }
        });

        const options = Array.from(optionsSet).sort((a, b) => {
          // Sort descending (terbaru di atas)
          const [ma, ya] = a.split(' ');
          const [mb, yb] = b.split(' ');
          if (ya !== yb) {
            return Number(yb) - Number(ya);
          }
          // Urutkan bulan (Jan - Dec)
          const monthOrder = [
            'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember',
          ];
          return monthOrder.indexOf(mb) - monthOrder.indexOf(ma);
        });

        setMonthYearOptions(options);
        setFilterMonthYear(options[0] || '');
      } catch (err) {
        console.error('Error fetching month year options:', err);
      }
    };

    // Hanya jalankan jika tidak sedang loading awal
    if (!isInitialLoading) {
      fetchMonthYearOptions();
    }
  }, [isInitialLoading]); // Dependency pada isInitialLoading

  // Filter paymentHistory sesuai filterMonthYear dan filterStatus
  const filteredHistory = paymentHistory.filter(payment => {
    // Filter berdasarkan bulan-tahun
    let monthYearMatch = true;
    if (filterMonthYear && payment.duedate) {
      const date = new Date(payment.duedate);
      const month = date.toLocaleString('id-ID', {month: 'long'});
      const year = date.getFullYear();
      const monthYearString = `${month} ${year}`;
      monthYearMatch = monthYearString === filterMonthYear;
    } else if (filterMonthYear && !payment.duedate) {
      // Jika tidak ada duedate, gunakan month dan year dari payment
      const monthYearString = `${payment.month} ${payment.year}`;
      monthYearMatch = monthYearString === filterMonthYear;
    }

    // Filter berdasarkan status
    let statusMatch = true;
    if (filterStatus !== 'Semua') {
      if (filterStatus === 'Lunas') {
        statusMatch =
          payment.status === 'Paid' ||
          payment.status === 'Lunas' ||
          payment.status === 'Sudah Dibayar';
      } else if (filterStatus === 'Belum Dibayar') {
        statusMatch =
          payment.status === 'Unpaid' || payment.status === 'Belum Dibayar';
      }
    }

    return monthYearMatch && statusMatch;
  });

  // Log semua payment history untuk debugging
  console.log('=== PAYMENT HISTORY DEBUG ===');
  console.log('All paymentHistory:', paymentHistory);
  console.log('Filter month/year:', filterMonthYear);
  console.log('Filter status:', filterStatus);
  console.log('Month year options:', monthYearOptions);
  console.log('Filtered history:', filteredHistory);
  console.log('=== END DEBUG ===');

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
        // colors={['#ffb347', '#fd7e14']}
        colors={['#E4571B', '#F26522']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        <Text style={styles.headerTitle}>Pembayaran</Text>
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
        {/* Due Date Period - hanya tampilkan jika ada tagihan yang belum dibayar */}
        {isInitialLoading ? (
          <View style={styles.skeletonBillingContainer}>
            <View style={styles.skeletonBillingCard}>
              <Animated.View
                style={[
                  styles.skeletonBillingHeader,
                  {opacity: skeletonOpacity},
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonBillingContent,
                  {opacity: skeletonOpacity},
                ]}
              />
              <Animated.View
                style={[
                  styles.skeletonBillingButton,
                  {opacity: skeletonOpacity},
                ]}
              />
            </View>
          </View>
        ) : billingPeriod.amount > 0 ? (
          <View style={styles.dueCardContainer}>
            <View style={styles.dueCard}>
              <View style={styles.dueCardHeader}>
                <Text style={styles.dueCardTitle}>Periode Jatuh Tempo</Text>
                {billingPeriod.invoiceId && (
                  <View style={styles.invoiceCardContainer}>
                    <View style={styles.invoiceCard}>
                      <Icon
                        name="receipt"
                        size={16}
                        color="#F26522"
                        style={styles.invoiceIcon}
                      />
                      <Text style={styles.invoiceInlineText}>
                        <Text style={styles.invoiceLabel}>Invoice ID: </Text>
                        <Text style={styles.invoiceNumber}>
                          {billingPeriod.invoiceNum
                            ? `#${billingPeriod.invoiceNum}`
                            : `#${billingPeriod.invoiceId}`}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}
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
        ) : paymentHistory.length > 0 ? (
          <View style={styles.noBillingContainer}>
            <Text style={styles.noBillingText}>
              Anda belum mempunyai tagihan
            </Text>
          </View>
        ) : (
          <View style={styles.noBillingContainer}>
            {isInitialLoading ? (
              <View style={styles.noPaymentHistoryLoadingContainer}>
                <ActivityIndicator size="large" color="#F26522" />
                <Text style={styles.loadingText}>Memuat data tagihan...</Text>
              </View>
            ) : (
              <Text style={styles.noBillingText}>
                Tidak ada data tagihan tersedia
              </Text>
            )}
          </View>
        )}

        {/* Payment Status */}
        <View
          style={[
            styles.paymentStatusContainer,
            isInitialLoading && styles.loadingPaymentStatus,
          ]}>
          <View style={styles.paymentStatusIcon}>
            {isInitialLoading ? (
              <ActivityIndicator size="small" color="#4CD964" />
            ) : (
              <Text style={styles.checkIcon}>✓</Text>
            )}
          </View>
          <Text style={styles.paymentStatusText}>
            {isInitialLoading
              ? 'Memuat data tagihan...'
              : billingPeriod.amount > 0
              ? 'Daftar tagihan anda'
              : 'Daftar riwayat tagihan'}
          </Text>
        </View>

        {/* Filter Dropdown - hanya tampilkan jika tidak loading dan ada data */}
        {!isInitialLoading && monthYearOptions.length > 0 && (
          <>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterMonthYear}
                onValueChange={setFilterMonthYear}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}>
                {monthYearOptions.map(opt => (
                  <Picker.Item key={opt} label={`   ${opt}   `} value={opt} />
                ))}
              </Picker>
            </View>

            {/* Filter Status */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterStatus}
                onValueChange={setFilterStatus}
                style={styles.pickerStyle}
                itemStyle={styles.pickerItemStyle}>
                <Picker.Item label="   Semua Status   " value="Semua" />
                <Picker.Item label="   Lunas   " value="Lunas" />
                <Picker.Item
                  label="   Belum Dibayar   "
                  value="Belum Dibayar"
                />
              </Picker>
            </View>
          </>
        )}

        {/* Payment History List */}
        {isInitialLoading ? (
          <View style={styles.skeletonPaymentContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.skeletonPaymentItem}>
                <View style={styles.skeletonPaymentInfo}>
                  <Animated.View
                    style={[styles.skeletonText, {opacity: skeletonOpacity}]}
                  />
                  <Animated.View
                    style={[styles.skeletonBadge, {opacity: skeletonOpacity}]}
                  />
                </View>
                <View style={styles.skeletonPaymentAmount}>
                  <Animated.View
                    style={[styles.skeletonText, {opacity: skeletonOpacity}]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : refreshing ? (
          <View style={styles.skeletonPaymentContainer}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.skeletonPaymentItem}>
                <View style={styles.skeletonPaymentInfo}>
                  <Animated.View
                    style={[styles.skeletonText, {opacity: skeletonOpacity}]}
                  />
                  <Animated.View
                    style={[styles.skeletonBadge, {opacity: skeletonOpacity}]}
                  />
                </View>
                <View style={styles.skeletonPaymentAmount}>
                  <Animated.View
                    style={[styles.skeletonText, {opacity: skeletonOpacity}]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((payment, index) => (
            <View key={index} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentPeriod}>
                  {payment.month} {payment.year}
                </Text>
                <View
                  style={[
                    styles.paymentStatusBadge,
                    payment.status === 'Unpaid' ||
                    payment.status === 'Belum Dibayar'
                      ? styles.paymentStatusBadgeUnpaid
                      : payment.status === 'Cancelled' ||
                        payment.status === 'Dibatalkan'
                      ? styles.paymentStatusBadgeCancelled
                      : styles.paymentStatusBadgePaid,
                  ]}>
                  <Text style={styles.paymentStatusBadgeText}>
                    {payment.status}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentAmount}>
                <Text style={styles.paymentAmountText}>
                  {formatRupiah(payment.amount)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  payment.status === 'Unpaid' ||
                  payment.status === 'Belum Dibayar'
                    ? styles.exportButtonUnpaid
                    : payment.status === 'Cancelled' ||
                      payment.status === 'Dibatalkan'
                    ? styles.exportButtonCancelled
                    : styles.exportButtonPaid,
                ]}
                onPress={() => {
                  exportPDFInvoice(
                    payment.id || payment.invoicenum || '',
                    payment.status,
                    payment,
                  );
                }}>
                <Text
                  style={[
                    styles.exportButtonText,
                    payment.status === 'Unpaid' ||
                    payment.status === 'Belum Dibayar'
                      ? styles.exportButtonTextUnpaid
                      : payment.status === 'Cancelled' ||
                        payment.status === 'Dibatalkan'
                      ? styles.exportButtonTextCancelled
                      : styles.exportButtonTextPaid,
                  ]}>
                  Download Invoice
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noPaymentHistoryContainer}>
            {isInitialLoading ? (
              <View style={styles.noPaymentHistoryLoadingContainer}>
                <ActivityIndicator size="large" color="#F26522" />
                <Text style={styles.loadingText}>Memuat data tagihan...</Text>
              </View>
            ) : (
              <Text style={styles.noPaymentHistoryText}>
                {monthYearOptions.length > 0
                  ? 'Tidak ada tagihan di periode ini'
                  : 'Tidak ada data tagihan tersedia'}
              </Text>
            )}
          </View>
        )}

        {/* Tambahkan tombol Detail Invoice - hanya tampilkan jika tidak loading dan ada data */}
        {!isInitialLoading && paymentHistory.length > 0 && (
          <View style={styles.detailInvoiceContainer}>
            <TouchableOpacity
              style={styles.detailInvoiceButton}
              onPress={handleViewInvoiceDetails}>
              <Text style={styles.detailInvoiceButtonText}>
                Lihat Detail Invoice
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={[styles.bottomSpacer, {height: 100 + insets.bottom}]} />
      </ScrollView>

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
            <Icon name="home" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainerActive}>
            <Icon name="receipt" size={25} color="#fff" />
          </View>
          <Text style={styles.navTextActive}>Tagihan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Help')}>
          <View style={styles.navIconContainerInactive}>
            <Icon name="help" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Bantuan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo('Account')}>
          <View style={styles.navIconContainerInactive}>
            <Icon2 name="person" size={24} color="#F26522" />
          </View>
          <Text style={styles.navTextInactive}>Akun</Text>
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
                        {/* <Text style={styles.gatewayDescription}>
                          {item.description}
                        </Text> */}
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
                <Text style={styles.shareButtonText}>Back</Text>
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
                      {selectedPayment?.datepaid && selectedPayment.datepaid
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
    backgroundColor: '#f6f9ff',
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
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    color: '#f0f0f0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ee',
    borderRadius: 8,
    padding: 15,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 14,
  },
  paymentStatusText: {
    color: '#22325a',
    fontWeight: '500',
    fontSize: 15,
  },
  lastPaymentContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
    width: '100%',
  },
  lastPaymentTitle: {
    fontSize: 18,
    color: '#22325a',
    fontWeight: '600',
    marginBottom: 15,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 80, // Tambahkan minHeight untuk konsistensi tinggi
  },
  paymentItemTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'column',
    flex: 1, // Tambahkan flex: 1 agar mengambil ruang yang tersedia
    minWidth: 0, // Tambahkan minWidth: 0 agar flexShrink bisa bekerja
  },
  paymentPeriod: {
    fontSize: 16,
    color: '#22325a',
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 13,
    flexShrink: 1, // Tambahkan flexShrink agar text bisa menyusut jika perlu
    maxWidth: '70%', // Tambahkan maxWidth untuk membatasi lebar text
  },
  paymentStatusBadge: {
    backgroundColor: '#4CD964',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginLeft: 12,
    maxWidth: '80%', // Tambahkan maxWidth untuk membatasi lebar badge
  },
  paymentStatusBadgeUnpaid: {
    backgroundColor: '#FFCC00', // Kuning untuk status Belum Dibayar
  },
  paymentStatusBadgePaid: {
    backgroundColor: '#4CD964', // Hijau untuk status Lunas/Sudah Dibayar
  },
  paymentStatusBadgeCancelled: {
    backgroundColor: '#FF3B30', // Merah untuk status Cancelled
  },
  paymentStatusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center', // Tambahkan textAlign center
    flexShrink: 1, // Tambahkan flexShrink agar text bisa menyusut jika perlu
  },
  paymentAmount: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 120, // Kurangi dari 155 menjadi 120
    maxWidth: 140, // Tambahkan maxWidth untuk membatasi lebar
    marginRight: -110, // Kurangi dari -100 menjadi -60
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  paymentAmountText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 32,
    marginRight: -40, // Kurangi dari -80 menjadi -40
    textAlign: 'right',
    width: '100%',
    flexShrink: 1, // Tambahkan flexShrink agar text bisa menyusut jika perlu
  },
  arrowIcon: {
    fontSize: 24,
    color: '#fd7e14',
    marginRight: 15,
    marginLeft: 10, // Kurangi dari 20 menjadi 10
    fontWeight: 500,
    alignSelf: 'center',
  },
  arrowContainer: {
    // justifyContent: 'center',
    marginRight: 80, // Kurangi dari 130 menjadi 80
    // alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    backgroundColor: 'transparent', // Transparan
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
    backgroundColor: '#F26522',
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
    color: '#F26522',
  },
  navTextActive: {
    fontSize: 10,
    color: '#F26522',
    fontWeight: 'bold',
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
    paddingHorizontal: 15,
  },
  detailInvoiceButton: {
    backgroundColor: '#F26522',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    backgroundColor: '#F26522',
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
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPaymentHistoryText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    textAlign: 'center',
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
    padding: 5,
    borderRadius: 10,
    marginBottom: 5,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 10,
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
  invoiceInfoContainer: {
    marginTop: 5,
  },
  invoiceIdLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amountContainer: {
    marginTop: 15,
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
    color: '#22325a',
    fontWeight: '400',
    marginTop: 5,
  },
  dueCardFooter: {
    alignItems: 'center',
  },
  duePayButton: {
    backgroundColor: '#F26522',
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
  skeletonBillingContainer: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  skeletonBillingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonBillingHeader: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 10,
    width: '60%',
  },
  skeletonBillingContent: {
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  skeletonBillingButton: {
    height: 40,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  skeletonPaymentContainer: {
    padding: 15,
  },
  skeletonPaymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonPaymentInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 5,
    width: '80%',
  },
  skeletonBadge: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    width: '40%',
  },
  skeletonPaymentAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  exportButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#F26522',
    alignSelf: 'flex-end',
    marginLeft: 60, // Ubah dari -40 menjadi 60 untuk posisi yang lebih konsisten
    minWidth: 80, // Tambahkan minWidth untuk konsistensi lebar button
    maxWidth: 100, // Tambahkan maxWidth untuk membatasi lebar button
  },
  exportButtonUnpaid: {
    backgroundColor: '#FFF3CD', // Light yellow untuk invoice belum dibayar
    borderColor: '#FFCC00',
    marginLeft: 60, // Ubah dari 90 menjadi 60
  },
  exportButtonPaid: {
    backgroundColor: '#D4F5D4', // Light green untuk invoice sudah dibayar
    borderColor: '#4CD964',
    marginLeft: 60, // Ubah dari 90 menjadi 60
  },
  exportButtonCancelled: {
    backgroundColor: '#FFE4E1', // Light red untuk invoice dibatalkan
    borderColor: '#FF3B30',
    marginLeft: 60, // Ubah dari 90 menjadi 60
  },
  exportButtonText: {
    fontSize: 10,
    color: '#F26522',
    fontWeight: 'bold',
    textAlign: 'center', // Tambahkan textAlign center
    flexShrink: 1, // Tambahkan flexShrink agar text bisa menyusut jika perlu
  },
  exportButtonTextUnpaid: {
    color: '#B8860B', // Dark yellow text
  },
  exportButtonTextPaid: {
    color: '#228B22', // Dark green text
  },
  exportButtonTextCancelled: {
    color: '#8B0000', // Dark red text
  },
  pickerContainer: {
    marginBottom: 10,
    marginHorizontal: 15,
  },
  pickerStyle: {
    backgroundColor: '#fff',
    borderRadius: 8,
    color: '#000',
    textAlign: 'center', // untuk iOS
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerItemStyle: {
    textAlign: 'center',
  },
  bottomSpacer: {
    // hanya sebagai penanda, height akan tetap dinamis
  },
  invoiceCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  invoiceIcon: {
    marginRight: 5,
  },
  invoiceInlineText: {
    flexDirection: 'row',
  },
  invoiceLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  invoiceNumber: {
    color: '#fd7e14',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingPaymentStatus: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4CD964',
    borderWidth: 1,
  },
  noPaymentHistoryLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noBillingLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noBillingLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F26522',
    fontWeight: 'bold',
  },
});

export default PayScreen;
