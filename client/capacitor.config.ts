import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.magazinesrt.app',
  appName: 'Magazine SRT',
  webDir: 'dist',
  server: {
    // URL do servidor em produção
    url: 'https://magazine-srt.vercel.app',
    cleartext: true,
  },
  android: {
    // Permite mixed content (http em https)
    allowMixedContent: true,
    // Cor da splash screen
    backgroundColor: '#0b0b0b',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0b0b0b',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
