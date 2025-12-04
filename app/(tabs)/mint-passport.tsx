import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getHealthStatus,
  initializeBlockchain,
  mintMedicalPassport,
  type MedicalPassportInput,
} from '@/lib/passports';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MintPassportScreen() {
  const [formData, setFormData] = useState<MedicalPassportInput>({
    name: '',
    contactInfo: '',
    dateOfBirth: '',
    socialSecurityNumber: '',
    medicalHistory: '',
    pastDiagnoses: '',
    familyHistory: '',
    allergies: '',
    currentMedications: '',
    treatmentRegimens: '',
    vitalSigns: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isBlockchainReady, setIsBlockchainReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Automatically initialize blockchain on component load
    const initBlockchain = async () => {
      // First check if already initialized
      const healthStatus = getHealthStatus();
      if (healthStatus.status === 'healthy') {
        setIsBlockchainReady(true);
        return;
      }

      // If not initialized, initialize now
      setIsInitializing(true);
      setError(null);
      try {
        // Initialize blockchain with environment variables or config
        // The user should have RPC_URL and PRIVATE_KEY set in environment
        initializeBlockchain();
        setIsBlockchainReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize blockchain';
        setError(errorMessage);
        // Don't show alert on auto-init, just set error state
      } finally {
        setIsInitializing(false);
      }
    };

    initBlockchain();
  }, []);

  const handleInputChange = (field: keyof MedicalPassportInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    // At least name and contact info should be provided
    if (!formData.name?.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }
    if (!formData.contactInfo?.trim()) {
      Alert.alert('Validation Error', 'Please enter your contact information');
      return false;
    }
    return true;
  };

  const handleMint = async () => {
    if (!isBlockchainReady) {
      Alert.alert(
        'Blockchain Not Ready',
        'Please wait for the blockchain connection to initialize, or check your environment configuration.'
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mintMedicalPassport(formData);
      
      Alert.alert(
        'Success!',
        `Medical passport minted successfully!\n\nToken ID: ${result.tokenId}\nTransaction: ${result.transactionHash}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form after successful mint
              setFormData({
                name: '',
                contactInfo: '',
                dateOfBirth: '',
                socialSecurityNumber: '',
                medicalHistory: '',
                pastDiagnoses: '',
                familyHistory: '',
                allergies: '',
                currentMedications: '',
                treatmentRegimens: '',
                vitalSigns: '',
              });
            },
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint passport';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      borderColor: '#E0E0E0',
      color: '#333333',
      backgroundColor: '#F5F5F5',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <BackButton />
            <View style={styles.titleContainer}>
              <ThemedText type="title" style={styles.title} lightColor="#333333" darkColor="#333333">
                Mint Medical Passport
              </ThemedText>
              <ThemedText type="subtitle" style={styles.subtitle} lightColor="#666666" darkColor="#666666">
                Enter your medical information to create a blockchain-based medical passport
              </ThemedText>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.formSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle} lightColor="#333333" darkColor="#333333">
              Personal Information
            </ThemedText>

            <ThemedText style={styles.label}>Name *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Enter your full name"
              placeholderTextColor="#999999"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <ThemedText style={styles.label}>Contact Information *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Email or phone number"
              placeholderTextColor="#999999"
              value={formData.contactInfo}
              onChangeText={(value) => handleInputChange('contactInfo', value)}
              keyboardType="email-address"
            />

            <ThemedText style={styles.label}>Date of Birth</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999999"
              value={formData.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
            />

            <ThemedText style={styles.label}>Social Security Number</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="SSN (optional)"
              placeholderTextColor="#999999"
              value={formData.socialSecurityNumber}
              onChangeText={(value) => handleInputChange('socialSecurityNumber', value)}
              secureTextEntry
            />

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.sectionSpacing]} lightColor="#333333" darkColor="#333333">
              Medical History
            </ThemedText>

            <ThemedText style={styles.label}>Medical History</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Enter your medical history"
              placeholderTextColor="#999999"
              value={formData.medicalHistory}
              onChangeText={(value) => handleInputChange('medicalHistory', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <ThemedText style={styles.label}>Past Diagnoses</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="List past diagnoses"
              placeholderTextColor="#999999"
              value={formData.pastDiagnoses}
              onChangeText={(value) => handleInputChange('pastDiagnoses', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <ThemedText style={styles.label}>Family History</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Family medical history"
              placeholderTextColor="#999999"
              value={formData.familyHistory}
              onChangeText={(value) => handleInputChange('familyHistory', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.sectionSpacing]} lightColor="#333333" darkColor="#333333">
              Current Health Information
            </ThemedText>

            <ThemedText style={styles.label}>Allergies</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="List any allergies"
              placeholderTextColor="#999999"
              value={formData.allergies}
              onChangeText={(value) => handleInputChange('allergies', value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <ThemedText style={styles.label}>Current Medications</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="List current medications"
              placeholderTextColor="#999999"
              value={formData.currentMedications}
              onChangeText={(value) => handleInputChange('currentMedications', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <ThemedText style={styles.label}>Treatment Regimens</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Current treatment plans"
              placeholderTextColor="#999999"
              value={formData.treatmentRegimens}
              onChangeText={(value) => handleInputChange('treatmentRegimens', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <ThemedText style={styles.label}>Vital Signs</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Blood pressure, heart rate, etc."
              placeholderTextColor="#999999"
              value={formData.vitalSigns}
              onChangeText={(value) => handleInputChange('vitalSigns', value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* Mint Button */}
          <TouchableOpacity
            style={[
              styles.mintButton,
              (!isBlockchainReady || isLoading) && styles.mintButtonDisabled,
            ]}
            onPress={handleMint}
            disabled={!isBlockchainReady || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={styles.mintButtonText}>
                Mint Medical Passport
              </ThemedText>
            )}
          </TouchableOpacity>
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
    marginBottom: 24,
    gap: 16,
  },
  titleContainer: {
    gap: 8,
  },
  title: {
    color: '#333333',
  },
  subtitle: {
    opacity: 0.7,
    color: '#666666',
  },
  statusSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusSuccess: {
    color: '#00ff88',
    fontWeight: '600',
  },
  statusError: {
    color: '#ff4444',
    fontWeight: '600',
  },
  initButton: {
    backgroundColor: '#00ff88',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  initButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 8,
    color: '#333333',
    fontWeight: '600',
  },
  sectionSpacing: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.8,
    color: '#333333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  mintButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mintButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.6,
  },
  mintButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

