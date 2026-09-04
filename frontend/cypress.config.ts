import { defineConfig } from "cypress";
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local'})

export default defineConfig({
  e2e: {
    
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
      config.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      config.env.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      return config
    },
  },
});
