import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'UTXOUtils',
  webDir: 'dist',
  plugins: {
    BackgroundRunner: {
      label: 'com.capacitor.background.check',
      src: 'runners/runner.js',
      event: 'indexTransactionsForAddress',
      repeat: true,
      interval: 15,
      autoStart: true,
    },
  },
};

export default config;
