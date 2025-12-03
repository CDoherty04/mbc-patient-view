import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getPaymentRequests,
  updatePaymentRequestStatus,
  executeUSDCTransfer,
  usdcToBigInt,
  PaymentRequest,
  getEnvVar,
  storePaymentRequest,
} from '@/lib/payments';
import { getWalletAddress, initializeBlockchain } from '@/lib/passports';

export default function PaymentRequestsScreen() {
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
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
    loadPaymentRequests();
  }, []);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      // Get patient address from wallet
      const address = getWalletAddress();
      if (address) {
        setPatientAddress(address);
        const requests = getPaymentRequests(address);
        setPaymentRequests(requests);
      } else {
        Alert.alert(
          'Wallet Not Initialized',
          'Please initialize your wallet first by minting a medical passport.'
        );
      }
    } catch (error) {
      console.error('Error loading payment requests:', error);
      Alert.alert('Error', 'Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (request: PaymentRequest) => {
    if (!request.id) {
      Alert.alert('Error', 'Invalid payment request');
      return;
    }

    // Get patient's private key
    const privateKey = getEnvVar('PRIVATE_KEY');
    if (!privateKey) {
      Alert.alert(
        'Private Key Required',
        'Please set your PRIVATE_KEY in the environment variables to execute payments.'
      );
      return;
    }

    // Confirm payment
    Alert.alert(
      'Confirm Payment',
      `Send ${request.amount} USDC to ${request.pharmacistAddress.slice(0, 6)}...${request.pharmacistAddress.slice(-4)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setProcessingRequestId(request.id!);
              updatePaymentRequestStatus(request.id!, 'pending');

              const amountInSubunits = usdcToBigInt(request.amount);

              const result = await executeUSDCTransfer({
                privateKey,
                destinationAddress: request.pharmacistAddress,
                amount: amountInSubunits,
              });

              if (result.success) {
                updatePaymentRequestStatus(request.id!, 'completed');
                Alert.alert(
                  'Payment Successful',
                  `Successfully sent ${request.amount} USDC to the pharmacist.\n\nTransaction: ${result.burnTx.slice(0, 10)}...`
                );
                // Reload requests
                await loadPaymentRequests();
              } else {
                updatePaymentRequestStatus(request.id!, 'failed');
                Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
              }
            } catch (error: any) {
              updatePaymentRequestStatus(request.id!, 'failed');
              Alert.alert('Payment Error', error.message || 'An error occurred during payment');
            } finally {
              setProcessingRequestId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff88';
      case 'failed':
        return '#ff4444';
      case 'pending':
        return '#ffaa00';
      default:
        return '#888';
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
          <ThemedText style={styles.loadingText}>Loading payment requests...</ThemedText>
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
            Payment Requests
          </ThemedText>
          <TouchableOpacity onPress={loadPaymentRequests} style={styles.refreshButton}>
            <ThemedText style={styles.refreshText}>Refresh</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {paymentRequests.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No payment requests found.
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Payment requests from pharmacists will appear here.
              </ThemedText>
            </ThemedView>
          ) : (
            paymentRequests.map((request) => (
              <ThemedView key={request.id} style={styles.requestCard}>
                <ThemedView style={styles.requestHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.requestTitle}>
                    Payment Request #{request.tokenId}
                  </ThemedText>
                  <ThemedView
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) },
                    ]}
                  >
                    <ThemedText style={styles.statusText}>
                      {request.status.toUpperCase()}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.requestDetails}>
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Amount:</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                      {request.amount} USDC
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>To:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatAddress(request.pharmacistAddress)}
                    </ThemedText>
                  </ThemedView>

                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Created:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {request.status === 'pending' && (
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      processingRequestId === request.id && styles.payButtonDisabled,
                    ]}
                    onPress={() => handlePay(request)}
                    disabled={processingRequestId !== null}
                  >
                    {processingRequestId === request.id ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <ThemedText style={styles.payButtonText}>Pay Now</ThemedText>
                    )}
                  </TouchableOpacity>
                )}

                {request.status === 'completed' && (
                  <ThemedView style={styles.completedBadge}>
                    <ThemedText style={styles.completedText}>✓ Payment Completed</ThemedText>
                  </ThemedView>
                )}

                {request.status === 'failed' && (
                  <ThemedView style={styles.failedBadge}>
                    <ThemedText style={styles.failedText}>✗ Payment Failed</ThemedText>
                  </ThemedView>
                )}
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
  requestCard: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTitle: {
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requestDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 14,
  },
  payButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#00ff88',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  failedBadge: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  failedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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

