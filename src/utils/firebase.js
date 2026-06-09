import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Only initialize if config values are present
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = hasConfig ? initializeApp(firebaseConfig) : null;
export const messaging = app ? getMessaging(app) : null;

/**
 * Wait for a service worker registration to have an active worker.
 */
const waitForActiveServiceWorker = (registration) => {
  return new Promise((resolve) => {
    const sw = registration.installing || registration.waiting || registration.active;
    if (registration.active) {
      resolve(registration);
      return;
    }
    if (sw) {
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          resolve(registration);
        }
      });
    }
  });
};

export const requestForToken = async () => {
  if (!messaging) {
    console.warn('Firebase Messaging not initialized. Add VITE_FIREBASE_* env vars.');
    return null;
  }

  try {
    // Step 1: Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return null;
    }

    // Step 2: Register service worker and wait for it to activate
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await waitForActiveServiceWorker(registration);
    console.log('Service Worker active:', registration.active?.state);

    // Step 3: Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn('No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return resolve(null);
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
