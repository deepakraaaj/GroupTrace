import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grouptrace.app',
  appName: 'GroupTrace',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Geolocation: {
      // Required for background tracking on iOS
    },
    SpeechRecognition: {
      // Language defaults to device locale
    },
    TextToSpeech: {
      // Uses device TTS engine
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
