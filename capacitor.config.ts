import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.blacklanternstudios.budbalance",
  appName: "BudBalance",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
}

export default config