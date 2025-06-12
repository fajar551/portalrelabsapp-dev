// import * as DocumentPicker from 'expo-document-picker';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {launchImageLibrary} from 'react-native-image-picker';
// import IntentLauncher from 'react-native-intent-launcher';
// import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {openNewTicket} from '../../src/services/api';

interface OpenTicketScreenProps {
  navigateTo: (screen: string) => void;
  route?: any;
}

const OpenTicketScreen = ({navigateTo, route}: OpenTicketScreenProps) => {
  console.log('--- Render OpenTicketScreen ---');
  console.log('route?.params:', route?.params);
  const [departmentId, setDepartmentId] = useState<number>(
    route?.params?.departmentId ? Number(route.params.departmentId) : 1,
  );
  console.log('departmentId state:', departmentId);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [attachment, setAttachment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    console.log(
      'useEffect jalan, route?.params?.departmentId:',
      route?.params?.departmentId,
    );
    if (route?.params?.departmentId) {
      setDepartmentId(Number(route.params.departmentId));
      console.log(
        'Set departmentId dari param:',
        Number(route.params.departmentId),
      );
    }
  }, [route?.params?.departmentId]);

  const departments = [
    {id: 1, name: 'Technical Support'},
    {id: 2, name: 'Billing Support'},
    {id: 3, name: 'Finance & Tax'},
  ];

  const urgencies = [
    {value: 'Low', label: 'Low'},
    {value: 'Medium', label: 'Medium'},
    {value: 'High', label: 'High'},
  ];

  // const requestStoragePermission = async () => {
  //   if (Platform.OS === 'android') {
  //     try {
  //       if (Platform.Version >= 33) {
  //         // Android 13+ (API 33+)
  //         const permissions = [
  //           PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
  //           PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
  //           PERMISSIONS.ANDROID.READ_MEDIA_AUDIO,
  //         ];

  //         // Cek dulu permission yang sudah ada
  //         const checkResults = await Promise.all(
  //           permissions.map(permission => check(permission)),
  //         );

  //         // Jika ada yang belum diizinkan, minta izin
  //         if (checkResults.some(result => result !== RESULTS.GRANTED)) {
  //           const results = await Promise.all(
  //             permissions.map(permission => request(permission)),
  //           );

  //           return results.every(result => result === RESULTS.GRANTED);
  //         }
  //         return true;
  //       } else {
  //         // Android 12 dan di bawahnya
  //         const result = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  //         if (result !== RESULTS.GRANTED) {
  //           const requestResult = await request(
  //             PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  //           );
  //           return requestResult === RESULTS.GRANTED;
  //         }
  //         return true;
  //       }
  //     } catch (err) {
  //       console.warn('Error requesting storage permission:', err);
  //       return false;
  //     }
  //   }
  //   return true;
  // };

  // const pickFile = async () => {
  //   const res = await DocumentPicker.getDocumentAsync({type: '*/*'});
  //   if (res.type === 'success') {
  //     // res.uri, res.name, res.size, res.mimeType
  //     console.log(res);
  //   }
  // };

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Izin galeri ditolak');
      return;
    }
    launchImageLibrary(
      {
        mediaType: 'mixed',
        selectionLimit: 1,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Gagal memilih file', response.errorMessage || 'Error');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const file = response.assets[0];
          // CEK UKURAN FILE (dalam byte, 5 MB = 5 * 1024 * 1024)
          if (file.fileSize && file.fileSize > 5 * 1024 * 1024) {
            Alert.alert('Ukuran file terlalu besar', 'Maksimal 5 MB');
            return;
          }
          setAttachment(file);
        }
      },
    );
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Lengkapi Data', 'Subject dan pesan harus diisi.');
      return;
    }
    setLoading(true);
    try {
      await openNewTicket(departmentId, subject, message, urgency, attachment);
      Alert.alert('Sukses', 'Tiket berhasil dibuat!', [
        {text: 'OK', onPress: () => navigateTo('Help')},
      ]);
      setSubject('');
      setMessage('');
      setAttachment(null);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal membuat tiket');
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah perlu tampilkan panah
  const handleContentSizeChange = (contentWidth: number) => {
    const windowWidth = Dimensions.get('window').width - 40; // padding
    setShowRightArrow(contentWidth > windowWidth);
  };

  const handleScroll = (event: any) => {
    const {contentOffset, layoutMeasurement, contentSize} = event.nativeEvent;
    setShowLeftArrow(contentOffset.x > 5);
    setShowRightArrow(
      contentOffset.x + layoutMeasurement.width < contentSize.width - 5,
    );
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({x: 0, animated: true});
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({animated: true});
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginBottom: 18}}>
        <TouchableOpacity
          onPress={() => navigateTo('Help')}
          style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#22325a" />
        </TouchableOpacity>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.title}>Buat Tiket Baru</Text>
        </View>
        <View style={{width: 34}} />
      </View>
      <Text style={styles.label}>Departemen</Text>
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
        {showLeftArrow && (
          <TouchableOpacity onPress={scrollLeft} style={styles.arrowBtn}>
            <Icon name="chevron-left" size={28} color="#F26522" />
          </TouchableOpacity>
        )}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 4}}>
          {departments.map(dep => {
            // console.log('Render dep.id:', dep.id, 'departmentId:', departmentId);
            return (
              <TouchableOpacity
                key={dep.id}
                style={[
                  styles.selectItem,
                  departmentId === dep.id && styles.selectedItem,
                ]}
                onPress={() => {
                  // console.log('User pilih departemen:', dep.id);
                  setDepartmentId(dep.id);
                }}>
                <Text
                  style={
                    departmentId === dep.id
                      ? styles.selectedText
                      : styles.selectText
                  }>
                  {dep.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {showRightArrow && (
          <TouchableOpacity onPress={scrollRight} style={styles.arrowBtn}>
            <Icon name="chevron-right" size={28} color="#F26522" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
        placeholder="Masukkan subject"
      />
      <Text style={styles.label}>Pesan</Text>
      <TextInput
        style={[styles.input, {height: 90}]}
        value={message}
        onChangeText={setMessage}
        placeholder="Tulis pesan Anda"
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.label}>Urgency</Text>
      <View style={styles.selectWrap}>
        {urgencies.map(u => (
          <TouchableOpacity
            key={u.value}
            style={[
              styles.selectItem,
              urgency === u.value && styles.selectedItem,
            ]}
            onPress={() => setUrgency(u.value as any)}>
            <Text
              style={
                urgency === u.value ? styles.selectedText : styles.selectText
              }>
              {u.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.attachmentBtn} onPress={pickImage}>
        <Text style={styles.attachmentBtnText}>
          {attachment
            ? attachment.fileName || attachment.uri
            : 'Pilih File (Gambar/Video)'}
        </Text>
      </TouchableOpacity>
      <Text style={{color: 'red', fontSize: 12, marginTop: 4}}>
        *Silahkan Pilih Gambar Untuk di Upload (Maksimal 5 MB)
      </Text>
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Kirim Tiket</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9ff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22325a',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#22325a',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectWrap: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#F26522',
    borderColor: '#F26522',
  },
  selectText: {
    color: '#22325a',
    fontWeight: '500',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  attachmentBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  attachmentBtnText: {
    color: '#22325a',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#F26522',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  arrowBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OpenTicketScreen;
