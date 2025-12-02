import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'icon');

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
      backgroundColor: Platform.select({
        ios: backgroundColor,
        default: backgroundColor,
      }),
      borderColor,
      color: textColor,
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
          <ThemedText type="title" style={styles.title}>
            Mint Medical Passport
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Enter your medical information to create a blockchain-based medical passport
          </ThemedText>

          {/* Error Display */}
          {error && (
            <ThemedView style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </ThemedView>
          )}

          {/* Form Fields */}
          <ThemedView style={styles.formSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Personal Information
            </ThemedText>

            <ThemedText style={styles.label}>Name *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Enter your full name"
              placeholderTextColor={borderColor}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />

            <ThemedText style={styles.label}>Contact Information *</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="Email or phone number"
              placeholderTextColor={borderColor}
              value={formData.contactInfo}
              onChangeText={(value) => handleInputChange('contactInfo', value)}
              keyboardType="email-address"
            />

            <ThemedText style={styles.label}>Date of Birth</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={borderColor}
              value={formData.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
            />

            <ThemedText style={styles.label}>Social Security Number</ThemedText>
            <TextInput
              style={inputStyle}
              placeholder="SSN (optional)"
              placeholderTextColor={borderColor}
              value={formData.socialSecurityNumber}
              onChangeText={(value) => handleInputChange('socialSecurityNumber', value)}
              secureTextEntry
            />

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.sectionSpacing]}>
              Medical History
            </ThemedText>

            <ThemedText style={styles.label}>Medical History</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="Enter your medical history"
              placeholderTextColor={borderColor}
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
              placeholderTextColor={borderColor}
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
              placeholderTextColor={borderColor}
              value={formData.familyHistory}
              onChangeText={(value) => handleInputChange('familyHistory', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, styles.sectionSpacing]}>
              Current Health Information
            </ThemedText>

            <ThemedText style={styles.label}>Allergies</ThemedText>
            <TextInput
              style={[inputStyle, styles.textArea]}
              placeholder="List any allergies"
              placeholderTextColor={borderColor}
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
              placeholderTextColor={borderColor}
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
              placeholderTextColor={borderColor}
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
              placeholderTextColor={borderColor}
              value={formData.vitalSigns}
              onChangeText={(value) => handleInputChange('vitalSigns', value)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </ThemedView>

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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
    opacity: 0.7,
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
  },
  formSection: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  mintButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
  },
  mintButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  mintButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

