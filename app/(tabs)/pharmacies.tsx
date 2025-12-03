import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePharmacy } from '@/contexts/PharmacyContext';
import {
  Pharmacy,
  deletePharmacy,
  getPharmacies,
  getSelectedPharmacyId,
  isValidEthereumAddress,
  savePharmacy,
  setSelectedPharmacyId,
} from '@/lib/pharmacies';

export default function PharmaciesScreen() {
  const router = useRouter();
  const { refreshSelectedPharmacy } = usePharmacy();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      setLoading(true);
      const [pharmaciesList, selectedId] = await Promise.all([
        getPharmacies(),
        getSelectedPharmacyId(),
      ]);
      setPharmacies(pharmaciesList);
      setSelectedPharmacyIdState(selectedId);
    } catch (error) {
      console.error('Error loading pharmacies:', error);
      Alert.alert('Error', 'Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPharmacy = () => {
    setEditingPharmacy(null);
    setFormName('');
    setFormAddress('');
    setModalVisible(true);
  };

  const handleEditPharmacy = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy);
    setFormName(pharmacy.name);
    setFormAddress(pharmacy.ethereumAddress);
    setModalVisible(true);
  };

  const handleDeletePharmacy = (pharmacy: Pharmacy) => {
    Alert.alert(
      'Delete Pharmacy',
      `Are you sure you want to delete "${pharmacy.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePharmacy(pharmacy.id);
              await loadPharmacies();
            } catch (error) {
              console.error('Error deleting pharmacy:', error);
              Alert.alert('Error', 'Failed to delete pharmacy');
            }
          },
        },
      ]
    );
  };

  const handleSelectPharmacy = async (pharmacy: Pharmacy) => {
    try {
      await setSelectedPharmacyId(pharmacy.id);
      setSelectedPharmacyIdState(pharmacy.id);
      await refreshSelectedPharmacy(); // Refresh context
      Alert.alert('Success', `Selected "${pharmacy.name}" as your pharmacy`);
    } catch (error) {
      console.error('Error selecting pharmacy:', error);
      Alert.alert('Error', 'Failed to select pharmacy');
    }
  };

  const handleSavePharmacy = async () => {
    // Validation
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a pharmacy name');
      return;
    }

    if (!formAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter an Ethereum address');
      return;
    }

    const trimmedAddress = formAddress.trim();
    if (!isValidEthereumAddress(trimmedAddress)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid Ethereum address (must start with 0x and be 42 characters long)'
      );
      return;
    }

    try {
      if (editingPharmacy) {
        await savePharmacy({
          ...editingPharmacy,
          name: formName.trim(),
          ethereumAddress: trimmedAddress,
        });
      } else {
        await savePharmacy({
          name: formName.trim(),
          ethereumAddress: trimmedAddress,
        });
      }
      setModalVisible(false);
      await loadPharmacies();
      Alert.alert('Success', editingPharmacy ? 'Pharmacy updated' : 'Pharmacy added');
    } catch (error) {
      console.error('Error saving pharmacy:', error);
      Alert.alert('Error', 'Failed to save pharmacy');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <ActivityIndicator size="large" color="#00ff88" />
          <ThemedText style={styles.loadingText}>Loading pharmacies...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            My Pharmacies
          </ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPharmacy}>
            <ThemedText style={styles.addButtonText}>+ Add</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {pharmacies.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No pharmacies added yet.
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Add a pharmacy to get started.
              </ThemedText>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddPharmacy}>
                <ThemedText style={styles.emptyButtonText}>Add Your First Pharmacy</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            pharmacies.map((pharmacy) => (
              <ThemedView key={pharmacy.id} style={styles.pharmacyCard}>
                <ThemedView style={styles.pharmacyHeader}>
                  <ThemedView style={styles.pharmacyInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.pharmacyName}>
                      {pharmacy.name}
                    </ThemedText>
                    <ThemedText style={styles.pharmacyAddress}>
                      {formatAddress(pharmacy.ethereumAddress)}
                    </ThemedText>
                  </ThemedView>
                  {selectedPharmacyId === pharmacy.id && (
                    <ThemedView style={styles.selectedBadge}>
                      <ThemedText style={styles.selectedText}>Selected</ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>

                <ThemedView style={styles.pharmacyActions}>
                  {selectedPharmacyId !== pharmacy.id && (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => handleSelectPharmacy(pharmacy)}
                    >
                      <ThemedText style={styles.selectButtonText}>Select</ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditPharmacy(pharmacy)}
                  >
                    <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePharmacy(pharmacy)}
                  >
                    <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <ThemedView style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>
                  {editingPharmacy ? 'Edit Pharmacy' : 'Add Pharmacy'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText style={styles.closeButtonText}>✕</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <ThemedView style={styles.form}>
                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Pharmacy Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="Enter pharmacy name"
                    placeholderTextColor="#666"
                  />
                </ThemedView>

                <ThemedView style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Ethereum Address</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formAddress}
                    onChangeText={setFormAddress}
                    placeholder="0x..."
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </ThemedView>

                <TouchableOpacity style={styles.saveButton} onPress={handleSavePharmacy}>
                  <ThemedText style={styles.saveButtonText}>
                    {editingPharmacy ? 'Update Pharmacy' : 'Add Pharmacy'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pharmacyCard: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pharmacyInfo: {
    flex: 1,
    gap: 4,
  },
  pharmacyName: {
    fontSize: 18,
  },
  pharmacyAddress: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: 'monospace',
  },
  selectedBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pharmacyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    opacity: 0.7,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

