import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getWalletAddress, initializeBlockchain } from '@/lib/passports';
import {
  PaymentRequest,
  executeUSDCTransfer,
  getEnvVar,
  getPaymentRequests,
  updatePaymentRequestStatus,
  usdcToBigInt
} from '@/lib/payments';

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
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
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
            <ThemedText style={styles.loadingText}>Loading payment requests...</ThemedText>
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
              Payment Requests
            </ThemedText>
            <TouchableOpacity onPress={loadPaymentRequests} style={styles.refreshButton}>
              <ThemedText style={styles.refreshText}>Refresh</ThemedText>
            </TouchableOpacity>
          </View>

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
                  <ThemedText type="defaultSemiBold" style={styles.requestTitle} lightColor="#333333" darkColor="#333333">
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
                    <ThemedText type="defaultSemiBold" style={styles.detailValue} lightColor="#333333" darkColor="#333333">
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTitle: {
    fontSize: 18,
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
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
    color: '#666666',
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#4A90E2',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  failedBadge: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  failedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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

