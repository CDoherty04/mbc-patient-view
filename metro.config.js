// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

// Ensure EXPO_ROUTER_APP_ROOT is set before Metro config is evaluated
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = './app';
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;

