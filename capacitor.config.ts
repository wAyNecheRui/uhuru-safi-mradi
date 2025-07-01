
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.650cf0a2871e4448bdc4a29898cc14e9',
  appName: 'Uhuru Safi Mradi',
  webDir: 'dist',
  server: {
    url: 'https://650cf0a2-871e-4448-bdc4-a29898cc14e9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1f2937",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999"
    },
    StatusBar: {
      style: "dark"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
