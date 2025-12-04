import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getWalletAddress, initializeBlockchain } from '@/lib/passports';
import { getEnvVar } from '@/lib/payments';
import {
  PrescriptionNFT,
  readPrescriptionNFTsForOwner,
} from '@/lib/prescriptions';

const PRESCRIPTION_CONTRACT_ADDRESS = "0x51fCc50146E3920f0ce2a91b59B631235Aa52dd3";

export default function PrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<PrescriptionNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientAddress, setPatientAddress] = useState<string | null>(null);

  useEffect(() => {
    // Initialize blockchain to get wallet address
    try {
      const privateKey = getEnvVar('PRIVATE_KEY');
      if (privateKey) {
        initializeBlockchain({ privateKey });
      }
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
    }
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      // Get patient address from wallet
      const address = getWalletAddress();
      if (address) {
        setPatientAddress(address);
        const nfts = await readPrescriptionNFTsForOwner(
          PRESCRIPTION_CONTRACT_ADDRESS,
          address
        );
        setPrescriptions(nfts);
      } else {
        Alert.alert(
          'Wallet Not Initialized',
          'Please initialize your wallet first by minting a medical passport.'
        );
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
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
            <ThemedText style={styles.loadingText}>Loading prescriptions...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!patientAddress) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <BackButton />
          </View>
          <View style={styles.centerContent}>
            <ThemedText style={styles.errorText}>
              Wallet not initialized. Please mint a medical passport first.
            </ThemedText>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/(tabs)/mint-passport')}
            >
              <ThemedText style={styles.buttonText}>Go to Mint Passport</ThemedText>
            </TouchableOpacity>
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
              My Prescriptions
            </ThemedText>
            <TouchableOpacity onPress={loadPrescriptions} style={styles.refreshButton}>
              <ThemedText style={styles.refreshText}>Refresh</ThemedText>
            </TouchableOpacity>
          </View>
          {prescriptions.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No active prescriptions found.
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Your prescription NFTs will appear here once they are minted.
              </ThemedText>
            </ThemedView>
          ) : (
            prescriptions.map((prescription) => (
              <View key={prescription.tokenId} style={styles.prescriptionCard}>
                <View style={styles.prescriptionHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.prescriptionTitle} lightColor="#333333" darkColor="#333333">
                    {prescription.medication || 'Prescription'}
                  </ThemedText>
                  <View style={styles.tokenBadge}>
                    <ThemedText style={styles.tokenText}>
                      Token #{prescription.tokenId}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.prescriptionDetails}>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Medication:</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.detailValue} lightColor="#333333" darkColor="#333333">
                      {prescription.medication || 'N/A'}
                    </ThemedText>
                  </View>

                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Dosage:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {prescription.dosage || 'N/A'}
                    </ThemedText>
                  </View>

                  {prescription.instructions && (
                    <View style={styles.instructionsContainer}>
                      <ThemedText style={styles.detailLabel}>Instructions:</ThemedText>
                      <ThemedText style={styles.instructionsText}>
                        {prescription.instructions}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Owner:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatAddress(prescription.owner)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
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
  prescriptionCard: {
    backgroundColor: '#F0F8FF',
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
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  prescriptionTitle: {
    fontSize: 18,
    flex: 1,
    color: '#333333',
  },
  tokenBadge: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  prescriptionDetails: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    opacity: 0.8,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  instructionsContainer: {
    gap: 4,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333333',
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333333',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

