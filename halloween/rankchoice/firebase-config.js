// Paste the values from Firebase console > Project settings > Your apps > Web app.
// These are public identifiers, not secrets; access is enforced by firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyCmAADVPuZS5zjgLLQ5QafjsQ-wnOqFrKk',
  authDomain: 'halloween-costume-rank-choice.firebaseapp.com',
  projectId: 'halloween-costume-rank-choice',
  appId: '1:827192318217:web:493eb0503a07599651dbd8'
};

// The only Google account allowed to start, reset, edit, and tally. Must match firestore.rules.
export const ADMIN_EMAIL = 'calebcsanchez1@gmail.com';
