import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <ActivityIndicator size="large" color="#00ff88" />
          <ThemedText style={styles.loadingText}>Loading prescriptions...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!patientAddress) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.container}>
          <ThemedText style={styles.errorText}>
            Wallet not initialized. Please mint a medical passport first.
          </ThemedText>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/mint-passport')}
          >
            <ThemedText style={styles.buttonText}>Go to Mint Passport</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            My Prescriptions
          </ThemedText>
          <TouchableOpacity onPress={loadPrescriptions} style={styles.refreshButton}>
            <ThemedText style={styles.refreshText}>Refresh</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
              <ThemedView key={prescription.tokenId} style={styles.prescriptionCard}>
                <ThemedView style={styles.prescriptionHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.prescriptionTitle}>
                    {prescription.medication || 'Prescription'}
                  </ThemedText>
                  <ThemedView style={styles.tokenBadge}>
                    <ThemedText style={styles.tokenText}>
                      Token #{prescription.tokenId}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.prescriptionDetails}>
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Medication:</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                      {prescription.medication || 'N/A'}
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Dosage:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {prescription.dosage || 'N/A'}
                    </ThemedText>
                  </ThemedView>

                  {prescription.instructions && (
                    <ThemedView style={styles.instructionsContainer}>
                      <ThemedText style={styles.detailLabel}>Instructions:</ThemedText>
                      <ThemedText style={styles.instructionsText}>
                        {prescription.instructions}
                      </ThemedText>
                    </ThemedView>
                  )}

                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Owner:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatAddress(prescription.owner)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
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
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    color: '#00ff88',
    fontSize: 14,
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
    gap: 8,
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
  prescriptionCard: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionTitle: {
    fontSize: 18,
    flex: 1,
  },
  tokenBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  prescriptionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  instructionsContainer: {
    gap: 4,
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 14,
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

