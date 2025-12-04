import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text } from 'react-native';

export function WelcomeBanner() {
  return (
    <LinearGradient
      colors={['#4A90E2', '#50C9C3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}>
      <Text style={styles.welcomeText}>Welcome back!</Text>
      <Text style={styles.subtitleText}>How can we help you today?</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    minHeight: 140,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.95,
  },
});

