import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rovex.mgt',
  appName: 'Rovex MGT',
  webDir: 'dist',
  // Frontend bundled localmente - mais estável para produção
  // Para updates automáticos, adicionar: server: { url: 'https://SEU_DOMINIO' }
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
