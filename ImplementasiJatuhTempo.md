# Panduan Implementasi Fitur Periode Jatuh Tempo di HomeScreen

Berikut adalah panduan langkah demi langkah untuk mengimplementasikan fitur Periode Jatuh Tempo dari PayScreen ke HomeScreen secara lengkap dengan API dan CSS.

## 1. Import Tambahan

Tambahkan import API yang diperlukan:

```typescript
import {
  getClientInvoices,
  getPaymentGateways,
  getPaymentHistory,
} from '../../src/services/api';
```

Tambahkan import komponen dan hook React Native tambahan:

```typescript
import {
  ActivityIndicator,
  Alert,
  Animated,
  // ... komponen lainnya
} from 'react-native';
```

## 2. State Tambahan

Tambahkan state untuk Periode Jatuh Tempo di komponen HomeScreen:

```typescript
// State untuk periode jatuh tempo
const [billingPeriod, setBillingPeriod] = useState({
  startDate: new Date(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  amount: 0, // Default 0 yang berarti tidak ada tagihan
});
const [daysLeft, setDaysLeft] = useState(0);
const [_progress, setProgress] = useState(0);
const progressAnim = useRef(new Animated.Value(0)).current;
const [error, setError] = useState('');

// Data pembayaran dari API
const [paymentHistory, setPaymentHistory] = useState([]);

// State untuk payment gateway
const [paymentGateways, setPaymentGateways] = useState([]);
const [isGatewaysLoading, setIsGatewaysLoading] = useState(false);
const [paymentGatewayModalVisible, setPaymentGatewayModalVisible] =
  useState(false);
```

## 3. Fungsi untuk Mengambil Data Invoice

Tambahkan fungsi fetchInvoiceData untuk mendapatkan data invoice dari API:

```typescript
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
```

## 4. Perbarui useEffect

Tambahkan panggilan ke fetchInvoiceData dalam useEffect:

```typescript
useEffect(() => {
  fetchUserData();
  fetchInvoiceData();
}, []);
```

## 5. Tambahkan Fungsi Helper

Tambahkan fungsi helper untuk mengkalkulasi progress dan format tanggal:

```typescript
// Format tanggal untuk tampilan
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('id-ID', {month: 'short'});
  return {day, month};
};

// Menghitung hari tersisa dan progress
useEffect(() => {
  const calculateProgress = () => {
    const today = new Date();

    // Total hari dalam periode
    const totalDays = Math.floor(
      (billingPeriod.dueDate.getTime() - billingPeriod.startDate.getTime()) /
        (1000 * 3600 * 24),
    );

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
```

## 6. Fungsi Event Handler

Tambahkan fungsi handlePayNow untuk tombol Bayar Sekarang:

```typescript
const handlePayNow = () => {
  navigateTo('Pay');
};
```

## 7. Tambahkan UI untuk Periode Jatuh Tempo

Tambahkan UI kondisional di dalam komponen HomeScreen sebelum Bottom Navigation:

```jsx
{
  /* Periode Jatuh Tempo - Disalin dari PayScreen */
}
{
  billingPeriod.amount > 0 ? (
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
          <TouchableOpacity style={styles.duePayButton} onPress={handlePayNow}>
            <Text style={styles.duePayButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : (
    <View style={styles.noBillingContainer}>
      <Text style={styles.noBillingText}>Anda belum mempunyai tagihan</Text>
    </View>
  );
}

{
  /* Payment Status */
}
<View style={styles.paymentStatusContainer}>
  <View style={styles.paymentStatusIcon}>
    <Text style={styles.checkIcon}>✓</Text>
  </View>
  <Text style={styles.paymentStatusText}>
    {billingPeriod.amount > 0
      ? 'Pembayaran terakhir telah diterima'
      : 'Semua tagihan telah dibayar'}
  </Text>
</View>;
```

## 8. Tambahkan style yang Diperlukan

Tambahkan style berikut ke objek styles:

```typescript
// Styles untuk Periode Jatuh Tempo
dueCardContainer: {
  padding: 15,
  backgroundColor: '#f5f5f5',
  marginTop: 15,
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
progressBarContainer: {
  height: 12,
  backgroundColor: 'rgba(0,0,0,0.1)',
  borderRadius: 6,
  overflow: 'hidden',
  width: '100%',
},
progressBar: {
  height: 12,
  borderRadius: 6,
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
  borderRadius: 1,
},
progressDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  position: 'absolute',
  left: 0,
},

// Style untuk tampilan status dan notifikasi
centerContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
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
```

## 9. Tambahkan Error Handling

Tambahkan logika untuk menangani error:

```jsx
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
```

## 10. Perbarui Fungsi onRefresh

Ubah fungsi onRefresh untuk juga memuat ulang data invoice:

```typescript
const onRefresh = async () => {
  setRefreshing(true);
  await Promise.all([fetchUserData(), fetchInvoiceData()]);
};
```
