import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {getAllClients} from '../../src/services/api';
import FilePickerManager from 'react-native-file-picker';

interface Client {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
}

const ClientDropdown = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllClients();

      // Pastikan data yang diterima adalah array
      if (Array.isArray(data) && data.length > 0) {
        console.log('Received client data:', data.length, 'clients');
        setClients(data);

        // Jika modal sedang dibuka, biarkan tetap terbuka
        if (modalVisible) {
          // Modal sudah terbuka, tidak perlu diubah
        }
      } else {
        console.warn('Received empty or invalid client data');
        setError('Tidak ada data client yang ditemukan');
      }
    } catch (err) { // Mengubah nama variabel dari 'error' menjadi 'err'
      console.error('Error fetching clients:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengambil data',
      );
    } finally {
      setLoading(false);
    }
  }, [modalVisible]);

  useEffect(() => {
    // Ambil data client saat komponen dimuat
    fetchClients();
  }, [fetchClients]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setModalVisible(false);
  };

  const handlePickAttachment = async () => {
    try {
      const res = await FilePickerManager.showFilePicker(
        { ... },
        response => {
          console.log('FilePicker response:', response);
          if (response.didCancel) {
            // User cancel
            return;
          } else if (response.error) {
            Alert.alert('Gagal memilih file', String(response.error));
          } else {
            setAttachment(response);
          }
        }
      );
      setAttachment(res);
    } catch (err) {
      if (err instanceof Error) {
        Alert.alert('Gagal memilih file', err.message);
      } else {
        Alert.alert('Gagal memilih file', 'Terjadi kesalahan saat memilih file');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownButtonText}>
          {selectedClient
            ? `${selectedClient.firstname} ${selectedClient.lastname}`
            : 'Pilih Client untuk Test Koneksi API'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#2e7ce4" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchClients}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {selectedClient && (
        <View style={styles.clientInfo}>
          <Text style={styles.infoLabel}>
            ID: <Text style={styles.infoValue}>{selectedClient.id}</Text>
          </Text>
          <Text style={styles.infoLabel}>
            Nama:{' '}
            <Text style={styles.infoValue}>
              {selectedClient.firstname} {selectedClient.lastname}
            </Text>
          </Text>
          <Text style={styles.infoLabel}>
            Email: <Text style={styles.infoValue}>{selectedClient.email}</Text>
          </Text>
          <Text style={styles.infoLabel}>
            Status:{' '}
            <Text style={styles.infoValue}>{selectedClient.status}</Text>
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Client</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fd7e14" />
                <Text style={styles.modalLoadingText}>Memuat data...</Text>
              </View>
            ) : (
              <ScrollView style={styles.clientList}>
                {clients.length > 0 ? (
                  clients.map(client => (
                    <TouchableOpacity
                      key={client.id}
                      style={styles.clientItem}
                      onPress={() => handleSelectClient(client)}>
                      <Text style={styles.clientName}>
                        {client.firstname} {client.lastname}
                      </Text>
                      <Text style={styles.clientEmail}>{client.email}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noDataText}>Tidak ada data client</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
  },
  dropdownButton: {
    backgroundColor: '#eaf2ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1dfff',
  },
  dropdownButtonText: {
    color: '#22325a',
    fontSize: 15,
    textAlign: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 4,
  },
  loadingText: {
    marginLeft: 8,
    color: '#4a5568',
    fontSize: 14,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clientInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f5f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  infoLabel: {
    fontSize: 15,
    color: '#4a5568',
    marginBottom: 8,
  },
  infoValue: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22325a',
  },
  closeButton: {
    fontSize: 20,
    color: '#a0aec0',
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalLoadingText: {
    marginTop: 10,
    color: '#4a5568',
    fontSize: 16,
  },
  clientList: {
    flex: 1,
  },
  clientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22325a',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#718096',
  },
  noDataText: {
    padding: 20,
    textAlign: 'center',
    color: '#a0aec0',
    fontSize: 16,
  },
});

export default ClientDropdown;
