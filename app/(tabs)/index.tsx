import { Image } from 'expo-image';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  const handlePay = () => {
    // TODO: Implement pay functionality
    alert('Pay functionality coming soon');
  };

  const handleViewPrescriptions = () => {
    // TODO: Implement view prescriptions functionality
    alert('View prescriptions functionality coming soon');
  };

  const handleSelectPharmacy = () => {
    // TODO: Implement select pharmacy functionality
    alert('Select pharmacy functionality coming soon');
  };

  const handleGeneralInfo = () => {
    // TODO: Implement general website info functionality
    alert('General website info coming soon');
  };

  const handleMintPassport = () => {
    router.push('/(tabs)/mint-passport');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Action Section */}
          <ThemedView style={styles.actionSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePay}>
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                Pay
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleViewPrescriptions}>
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                View Prescriptions
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSelectPharmacy}>
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                Select Pharmacy
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleGeneralInfo}>
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                General Website Info
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleMintPassport}>
              <ThemedText type="defaultSemiBold" style={styles.actionButtonText}>
                Mint Medical Passport
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* Patient Info Section */}
          <ThemedView style={styles.patientSection}>
            <Image
              source={require('@/assets/images/Patient.png')}
              style={styles.patientImage}
              contentFit="cover"
            />
            <ThemedView style={styles.patientInfo} lightColor="transparent" darkColor="transparent">
              <ThemedText type="defaultSemiBold" style={styles.patientName}>
                Charlie Doherty
              </ThemedText>
              <ThemedText type="default" style={styles.patientRole}>
                CompanyRX Patient
              </ThemedText>
            </ThemedView>
          </ThemedView>
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
    gap: 32,
    paddingBottom: 40,
  },
  actionSection: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
  },
  patientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 0,
  },
  patientImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  patientInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
  },
  patientRole: {
    fontSize: 14,
    opacity: 0.7,
  },
});
