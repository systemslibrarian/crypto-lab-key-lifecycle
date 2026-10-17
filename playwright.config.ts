import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',forbidOnly:!!process.env.CI,retries:0,reporter:'list',
  use:{baseURL:'http://127.0.0.1:4500/crypto-lab-key-lifecycle/',viewport:{width:1280,height:850}},
  webServer:{command:'npm run build && npm run preview -- --host 127.0.0.1 --port 4500 --strictPort',url:'http://127.0.0.1:4500/crypto-lab-key-lifecycle/',reuseExistingServer:!process.env.CI,timeout:120_000}
});
