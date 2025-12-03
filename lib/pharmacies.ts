import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Pharmacy {
  id: string;
  name: string;
  ethereumAddress: string;
  createdAt: number;
}

const PHARMACIES_STORAGE_KEY = '@pharmacies';
const SELECTED_PHARMACY_KEY = '@selected_pharmacy_id';

/**
 * Get all saved pharmacies
 */
export async function getPharmacies(): Promise<Pharmacy[]> {
  try {
    const data = await AsyncStorage.getItem(PHARMACIES_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error getting pharmacies:', error);
    return [];
  }
}

/**
 * Save a new pharmacy or update an existing one
 */
export async function savePharmacy(pharmacy: Omit<Pharmacy, 'id' | 'createdAt'> | Pharmacy): Promise<Pharmacy> {
  try {
    const pharmacies = await getPharmacies();
    
    let updatedPharmacy: Pharmacy;
    
    if ('id' in pharmacy) {
      // Update existing pharmacy
      const index = pharmacies.findIndex(p => p.id === pharmacy.id);
      if (index !== -1) {
        updatedPharmacy = {
          ...pharmacy,
          createdAt: pharmacies[index].createdAt, // Preserve original creation date
        };
        pharmacies[index] = updatedPharmacy;
      } else {
        throw new Error('Pharmacy not found');
      }
    } else {
      // Create new pharmacy
      updatedPharmacy = {
        ...pharmacy,
        id: `pharmacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      pharmacies.push(updatedPharmacy);
    }
    
    await AsyncStorage.setItem(PHARMACIES_STORAGE_KEY, JSON.stringify(pharmacies));
    return updatedPharmacy;
  } catch (error) {
    console.error('Error saving pharmacy:', error);
    throw error;
  }
}

/**
 * Delete a pharmacy by ID
 */
export async function deletePharmacy(id: string): Promise<void> {
  try {
    const pharmacies = await getPharmacies();
    const filtered = pharmacies.filter(p => p.id !== id);
    await AsyncStorage.setItem(PHARMACIES_STORAGE_KEY, JSON.stringify(filtered));
    
    // If deleted pharmacy was selected, clear selection
    const selectedId = await getSelectedPharmacyId();
    if (selectedId === id) {
      await AsyncStorage.removeItem(SELECTED_PHARMACY_KEY);
    }
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    throw error;
  }
}

/**
 * Get the currently selected pharmacy ID
 */
export async function getSelectedPharmacyId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELECTED_PHARMACY_KEY);
  } catch (error) {
    console.error('Error getting selected pharmacy ID:', error);
    return null;
  }
}

/**
 * Set the selected pharmacy ID
 */
export async function setSelectedPharmacyId(id: string | null): Promise<void> {
  try {
    if (id) {
      await AsyncStorage.setItem(SELECTED_PHARMACY_KEY, id);
    } else {
      await AsyncStorage.removeItem(SELECTED_PHARMACY_KEY);
    }
  } catch (error) {
    console.error('Error setting selected pharmacy ID:', error);
    throw error;
  }
}

/**
 * Get the currently selected pharmacy
 */
export async function getSelectedPharmacy(): Promise<Pharmacy | null> {
  try {
    const selectedId = await getSelectedPharmacyId();
    if (!selectedId) {
      return null;
    }
    
    const pharmacies = await getPharmacies();
    return pharmacies.find(p => p.id === selectedId) || null;
  } catch (error) {
    console.error('Error getting selected pharmacy:', error);
    return null;
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  // Basic validation: should start with 0x and be 42 characters long
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

