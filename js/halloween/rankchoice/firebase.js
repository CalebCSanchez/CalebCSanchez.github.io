import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, collection, onSnapshot, getDoc, getDocs, setDoc, deleteDoc, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { firebaseConfig, ADMIN_EMAIL } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const configRef = doc(db, 'rankchoice', 'config');
const ballotsRef = collection(db, 'rankchoice', 'config', 'ballots');

export const isConfigured = !firebaseConfig.apiKey.startsWith('YOUR_');
export const ballotKey = name => name.toLowerCase();
export const cleanName = name => name.trim().replace(/\s+/g, ' ');

export function watchConfig(cb) {
  return onSnapshot(configRef, snap => {
    const d = snap.exists() ? snap.data() : {};
    cb({ status: d.status || 'setup', candidates: d.candidates || [] });
  }, err => cb(null, err));
}

export function watchBallots(cb) {
  return onSnapshot(ballotsRef, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), err => cb(null, err));
}

export async function fetchBallots() {
  const snap = await getDocs(ballotsRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function hasVoted(name) {
  return (await getDoc(doc(ballotsRef, ballotKey(name)))).exists();
}

export function submitBallot(name, ranking) {
  return setDoc(doc(ballotsRef, ballotKey(name)), { name, ranking });
}

export function removeBallot(id) {
  return deleteDoc(doc(ballotsRef, id));
}

export async function saveConfig(patch) {
  const cur = await getDoc(configRef);
  await setDoc(configRef, { ...(cur.exists() ? cur.data() : {}), ...patch });
}

export async function resetAll() {
  const ballots = await getDocs(ballotsRef);
  const batch = writeBatch(db);
  ballots.forEach(d => batch.delete(d.ref));
  await batch.commit();
  await saveConfig({ status: 'setup' });
}

export const isAdmin = user => !!user && user.email === ADMIN_EMAIL;
export const watchAuth = cb => onAuthStateChanged(auth, cb);
export const signOutAdmin = () => signOut(auth);

export async function signInAdmin() {
  if (isAdmin(auth.currentUser)) return auth.currentUser;
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  if (!isAdmin(user)) { await signOut(auth); throw new Error('That account is not the host.'); }
  return user;
}
