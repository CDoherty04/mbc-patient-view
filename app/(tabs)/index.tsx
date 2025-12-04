import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionCard } from '@/components/action-card';
import { SummaryCard } from '@/components/summary-card';
import { ThemedView } from '@/components/themed-view';
import { WelcomeBanner } from '@/components/welcome-banner';

export default function HomeScreen() {
  const router = useRouter();

  const handlePay = () => {
    router.push('/(tabs)/payment-requests');
  };

  const handleViewPrescriptions = () => {
    router.push('/(tabs)/prescriptions');
  };

  const handleSelectPharmacy = () => {
    router.push('/(tabs)/pharmacies');
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
          {/* Welcome Banner */}
          <WelcomeBanner />

          {/* Action Cards Section */}
          <View style={styles.actionSection}>
            <ActionCard
              icon="credit-card"
              iconColor="#FFFFFF"
              iconBackgroundColor="#87CEEB"
              title="Pay Bills"
              subtitle="Quickly pay your pharmacy bills"
              onPress={handlePay}
            />
            
            <ActionCard
              icon="assignment"
              iconColor="#FFFFFF"
              iconBackgroundColor="#4CAF50"
              title="View Prescriptions"
              subtitle="Access all your prescriptions"
              onPress={handleViewPrescriptions}
            />
            
            <ActionCard
              icon="place"
              iconColor="#FFFFFF"
              iconBackgroundColor="#00BCD4"
              title="Select Pharmacy"
              subtitle="Find nearby pharmacies"
              onPress={handleSelectPharmacy}
            />
            
            <ActionCard
              icon="security"
              iconColor="#FFFFFF"
              iconBackgroundColor="#4CAF50"
              title="Digital Medical Passport"
              subtitle="Mint your secure health ID"
              onPress={handleMintPassport}
            />
          </View>

          {/* Summary Metrics Section */}
          <View style={styles.summarySection}>
            <SummaryCard value="5" label="Active RX" />
            <SummaryCard value="$0" label="Balance" />
            <SummaryCard value="3" label="Pharmacies" />
          </View>
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
  actionSection: {
    gap: 16,
    marginBottom: 24,
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
  },
});
