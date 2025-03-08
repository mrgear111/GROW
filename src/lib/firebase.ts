// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if all required Firebase config values are present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'databaseURL'] as const;
type RequiredKey = typeof requiredKeys[number];

// Now TypeScript knows that key is a valid key of firebaseConfig
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error(`Missing required Firebase configuration: ${missingKeys.join(', ')}`);
  // Provide fallback values for development only
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using fallback Firebase config for development');
    missingKeys.forEach(key => {
      // TypeScript now knows this is safe
      firebaseConfig[key] = key === 'databaseURL' 
        ? 'https://track-f05a1-default-rtdb.firebaseio.com'
        : 'dummy-value';
    });
  }
}

// Initialize Firebase with error handling
let app;
let db: Database;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create dummy implementations for development
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using mock Firebase implementation');
    db = {
      // Minimal mock implementation
      ref: () => ({}),
      // Add other methods as needed
    } as unknown as Database;
  } else {
    // In production, we need to provide a fallback
    throw new Error('Failed to initialize Firebase in production');
  }
}

export { db };
export default app; 