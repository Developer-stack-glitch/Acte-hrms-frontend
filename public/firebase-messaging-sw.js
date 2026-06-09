// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// IMPORTANT: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBfyAeoHath8Fm2HLVLS509F4anAlzGvg",
  authDomain: "hrms-android-app-72f55.firebaseapp.com",
  projectId: "hrms-android-app-72f55",
  storageBucket: "hrms-android-app-72f55.firebasestorage.app",
  messagingSenderId: "1330912619",
  appId: "1:1330912619:web:1a27be437231ac6827402e"
};

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
