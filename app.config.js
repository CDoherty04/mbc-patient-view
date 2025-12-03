const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local file
// This runs in Node.js during build time, so dotenv works here
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config(); // Also load .env as fallback

if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = './app';
}

module.exports = {
  expo: {
    name: 'mbc-patient-view',
    slug: 'mbc-patient-view',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'mbcpatientview',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    // Expose environment variables via extra config
    // This makes them available via expo-constants
    extra: {
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      RPC_URL: process.env.RPC_URL,
      PORT: process.env.PORT,
    },
  },
};

