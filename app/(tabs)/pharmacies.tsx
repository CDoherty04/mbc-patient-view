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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
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
          <View style={styles.header}>
            <BackButton />
          </View>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <ThemedText style={styles.loadingText}>Loading pharmacies...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BackButton />
            <ThemedText type="title" style={styles.title} lightColor="#333333" darkColor="#333333">
              My Pharmacies
            </ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPharmacy}>
              <ThemedText style={styles.addButtonText}>+ Add</ThemedText>
            </TouchableOpacity>
          </View>
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
                    <ThemedText type="defaultSemiBold" style={styles.pharmacyName} lightColor="#333333" darkColor="#333333">
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle} lightColor="#333333" darkColor="#333333">
                  {editingPharmacy ? 'Edit Pharmacy' : 'Add Pharmacy'}
                </ThemedText>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.closeButtonText} lightColor="#333333" darkColor="#333333">✕</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label} lightColor="#333333" darkColor="#333333">Pharmacy Name</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="Enter pharmacy name"
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label} lightColor="#333333" darkColor="#333333">Ethereum Address</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formAddress}
                    onChangeText={setFormAddress}
                    placeholder="0x..."
                    placeholderTextColor="#999999"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSavePharmacy}>
                  <ThemedText style={styles.saveButtonText}>
                    {editingPharmacy ? 'Update Pharmacy' : 'Add Pharmacy'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    color: '#666666',
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    minWidth: 200,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pharmacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
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
    color: '#333333',
  },
  pharmacyAddress: {
    fontSize: 14,
    opacity: 0.7,
    fontFamily: 'monospace',
    color: '#666666',
  },
  selectedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pharmacyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#50C9C3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333333',
    fontWeight: '600',
    lineHeight: 20,
  },
  form: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  inputGroup: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    opacity: 0.9,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    color: '#333333',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

