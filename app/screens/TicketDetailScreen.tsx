import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  getTicketAdminClientByTid,
  sendTicketReply,
} from '../../src/services/api';

// Konfigurasi API
const CONFIG = {
  API_URL: 'https://portal.relabs.id',
};

interface TicketDetailScreenProps {
  navigateTo: (screen: string, params?: any) => void;
  route?: {params?: {tid?: string}};
}

const TicketDetailScreen = ({navigateTo, route}: TicketDetailScreenProps) => {
  const tid = route?.params?.tid;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<any>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const intervalRef = useRef<any>(null);

  const fetchDetail = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError('');
    try {
      if (!tid) {
        return;
      }
      const data = await getTicketAdminClientByTid(tid);
      setTicket(data.ticket);
      setConversation(data.conversation || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail tiket');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!tid) {
      setError('ID tiket tidak ditemukan');
      setLoading(false);
      return;
    }
    fetchDetail(true);

    // Ambil nama user dari AsyncStorage
    const fetchUserName = async () => {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.name || '');
      }
    };
    fetchUserName();

    // Auto-refresh setiap 1 detik TANPA loading
    intervalRef.current = setInterval(() => {
      fetchDetail(false);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendReply = async () => {
    // Validasi: harus ada pesan atau attachment
    if (!replyMsg.trim() && !attachment) {
      return;
    }
    setSending(true);
    try {
      if (!tid) {
        return;
      }
      // LOG ATTACHMENT YANG DIKIRIM
      console.log('DEBUG KIRIM ATTACHMENT:', attachment);
      if (
        attachment &&
        attachment.uri &&
        attachment.type &&
        attachment.fileName
      ) {
        console.log('DEBUG KIRIM ATTACHMENT DETAIL:', {
          uri: attachment.uri,
          type: attachment.type,
          fileName: attachment.fileName,
        });
      }
      await sendTicketReply(tid, replyMsg, userName, attachment);
      const data = await getTicketAdminClientByTid(tid);
      setReplyMsg('');
      setAttachment(null);
      setConversation(data.conversation || []);
    } catch (err) {
      // Tampilkan error jika perlu
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setAttachment(response.assets[0]);
        }
      },
    );
  };

  const openFile = async (fileUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        console.log('Cannot open URL:', fileUrl);
        // Fallback: buka di browser
        await Linking.openURL(fileUrl);
      }
    } catch (err) {
      console.error('Error opening file:', err);
      Alert.alert(
        'Error',
        'Tidak dapat membuka file. Silakan coba lagi atau hubungi admin.',
        [{text: 'OK'}],
      );
    }
  };

  const renderBubble = (item: any, idx: number) => {
    const isAdmin = item.is_admin === 1;

    // Fungsi untuk mendeteksi tipe file
    const getFileType = (filename: string) => {
      if (!filename) {
        return '';
      }
      const ext = filename.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
        return 'image';
      }
      // selain itu return ''
      return '';
    };

    const fileType = getFileType(item.attachment);
    const attachmentUrl = `${CONFIG.API_URL}/attachments/${item.attachment}`;

    return (
      <View
        key={item.id + '-' + idx}
        style={[
          styles.bubbleWrap,
          isAdmin ? styles.bubbleLeft : styles.bubbleRight,
        ]}>
        <View
          style={[
            styles.bubble,
            isAdmin ? styles.bubbleAdmin : styles.bubbleUser,
          ]}>
          <Text style={styles.bubbleName}>
            {item.name || (isAdmin ? 'Admin Relabs' : 'Admin')}
          </Text>
          <Text style={styles.bubbleMsg}>{item.message}</Text>
          {item.attachment && (
            <View style={styles.attachmentContainer}>
              {fileType === 'image' ? (
                (() => {
                  console.log('DEBUG IMAGE ATTACHMENT:', item.attachment);
                  console.log(
                    'DEBUG IMAGE URL:',
                    item.attachment && item.attachment.uri
                      ? item.attachment.uri
                      : attachmentUrl,
                  );
                  return (
                    <Image
                      source={{
                        uri:
                          item.attachment && item.attachment.uri
                            ? item.attachment.uri
                            : attachmentUrl,
                      }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                      onError={() => {
                        console.log('GAGAL LOAD GAMBAR:', item.attachment);
                      }}
                    />
                  );
                })()
              ) : (
                <TouchableOpacity
                  style={styles.fileAttachmentContainer}
                  onPress={() => openFile(attachmentUrl)}>
                  <View style={styles.fileIconContainer}>
                    <Icon name={'description'} size={32} color="#F26522" />
                  </View>
                  <View style={styles.fileInfoRow}>
                    <Text style={styles.fileName}>{item.attachment}</Text>
                  </View>
                  <Text style={styles.fileTypeText}>File</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          <Text style={styles.bubbleDate}>{item.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#e0e7ff', '#fff']} style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigateTo('Help')}
          style={styles.backBtn}>
          <Icon name="arrow-back" size={26} color="#22325a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Tiket</Text>
        <View style={styles.headerSpacer} />
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#F26522" />
          <Text style={styles.loadingText}>Memuat Detail Tiket</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <LinearGradient
            colors={['#e0e7ff', '#fff']}
            style={styles.ticketInfoCard}>
            <View style={styles.ticketInfoRow}>
              <Icon
                name="info"
                size={24}
                color="#4F8EF7"
                style={styles.iconInfo}
              />
              <Text style={styles.ticketTitle}>{ticket?.title}</Text>
            </View>
            <Text style={styles.ticketStatus}>Status: {ticket?.status}</Text>
            <Text style={styles.ticketDate}>Tanggal: {ticket?.date}</Text>
            <Text style={styles.ticketUrgency}>Urgency: {ticket?.urgency}</Text>
            {ticket?.attachment && (
              <View style={styles.ticketAttachmentContainer}>
                <Text style={styles.attachmentLabel}>Attachment:</Text>
                {(() => {
                  const getFileType = (filename: string) => {
                    if (!filename) {
                      return '';
                    }
                    const ext = filename.toLowerCase().split('.').pop();
                    if (
                      ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(
                        ext || '',
                      )
                    ) {
                      return 'image';
                    }
                    return '';
                  };

                  const fileType = getFileType(ticket.attachment);
                  const attachmentUrl = `${CONFIG.API_URL}/attachments/mobilerelabs/${ticket.attachment}`;

                  return fileType === 'image' ? (
                    <Image
                      source={{
                        uri:
                          ticket.attachment && ticket.attachment.uri
                            ? ticket.attachment.uri
                            : attachmentUrl,
                      }}
                      style={styles.ticketAttachmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.ticketFileAttachmentContainer}
                      onPress={() => openFile(attachmentUrl)}>
                      <View style={styles.ticketFileIconContainer}>
                        <Icon name={'description'} size={24} color="#F26522" />
                      </View>
                      <View style={styles.fileInfoRow}>
                        <Text style={styles.ticketFileName}>
                          {ticket.attachment}
                        </Text>
                      </View>
                      {/* <Text style={styles.ticketFileTypeText}></Text> */}
                    </TouchableOpacity>
                  );
                })()}
              </View>
            )}
          </LinearGradient>
          {attachment && (
            <View style={styles.previewAttachment}>
              <Image
                source={{uri: attachment.uri}}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </View>
          )}
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}>
            <ScrollView
              style={styles.chatWrap}
              contentContainerStyle={styles.scrollContentBottom}
              keyboardShouldPersistTaps="handled">
              {conversation.map(renderBubble)}
            </ScrollView>
            <View style={styles.replyBar}>
              <TextInput
                style={styles.replyInput}
                placeholder="Tulis balasan atau pilih gambar..."
                value={replyMsg}
                onChangeText={setReplyMsg}
                editable={!sending}
                multiline
              />
              <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
                <Icon name="image" size={32} color="#F26522" />
              </TouchableOpacity>
              {attachment && (
                <View style={styles.previewAttachment}>
                  <Image
                    source={{uri: attachment.uri}}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity onPress={() => setAttachment(null)}>
                    <Text style={styles.previewDelete}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                onPress={handleSendReply}
                disabled={sending || (!replyMsg.trim() && !attachment)}
                style={styles.replyButton}>
                <Icon name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22325a',
    textAlign: 'center',
  },
  loadingWrap: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#22325a',
    fontWeight: '500',
  },
  errorText: {color: 'red', textAlign: 'center', marginTop: 30},
  ticketInfoCard: {
    borderRadius: 20,
    margin: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 4,
  },
  ticketStatus: {
    fontSize: 14,
    color: '#F26522',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  ticketDate: {fontSize: 13, color: '#666', fontWeight: '500', marginBottom: 2},
  ticketUrgency: {fontSize: 13, color: '#666', fontWeight: '500'},
  chatWrap: {flex: 1, paddingHorizontal: 12},
  bubbleWrap: {flexDirection: 'row', marginBottom: 16},
  bubbleLeft: {justifyContent: 'flex-start'},
  bubbleRight: {justifyContent: 'flex-end'},
  bubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bubbleAdmin: {
    backgroundColor: '#f5f3f2',
    borderTopRightRadius: 0,
    borderWidth: 0,
  },
  bubbleName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
    color: '#F26522',
  },
  bubbleMsg: {fontSize: 15, color: '#22325a', marginBottom: 4},
  bubbleDate: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'right',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f6f9ff',
    fontSize: 15,
    minHeight: 40,
    maxHeight: 120,
    color: '#000',
  },
  imageBtn: {
    marginLeft: 8,
    backgroundColor: '#f6f9ff',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  replyButton: {
    marginLeft: 8,
    backgroundColor: '#F26522',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentContainer: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  attachmentImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    alignSelf: 'center',
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#eee',
  },
  ticketAttachmentContainer: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 4,
  },
  ticketAttachmentImage: {
    width: '100%',
    maxWidth: 200,
    aspectRatio: 4 / 3,
    maxHeight: 140,
    borderRadius: 8,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  previewAttachment: {
    alignItems: 'center',
    marginLeft: 8,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    resizeMode: 'cover',
  },
  previewDelete: {
    color: '#d32f2f',
    fontSize: 12,
  },
  headerSpacer: {
    width: 34,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInfo: {
    marginRight: 8,
  },
  flex1: {
    flex: 1,
  },
  scrollContentBottom: {
    paddingBottom: 80,
  },
  fileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
    marginBottom: 4,
  },
  fileIconContainer: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: 180,
  },
  fileName: {
    fontSize: 14,
    color: '#22325a',
    fontWeight: '500',
    textAlign: 'left',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 180,
  },
  fileTypeText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '400',
  },
  ticketFileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 4,
  },
  ticketFileIconContainer: {
    marginRight: 10,
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  ticketFileName: {
    fontSize: 13,
    color: '#22325a',
    fontWeight: '500',
    textAlign: 'left',
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: 180,
    marginBottom: 2,
  },
  ticketFileTypeText: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '400',
  },
});

export default TicketDetailScreen;
