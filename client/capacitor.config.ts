import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovex.mgt',
  appName: 'Rovex MGT',
  webDir: 'dist',
  // Frontend é carregado do Vercel - atualizações automáticas sem rebuild do APK
  server: {
    url: 'https://magazinemgt.com',
    cleartext: false, // HTTPS only
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
