import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVWKRCtjg7ppR-D8ZNs-TfSwPlWdXXQ5Q",
  authDomain: "greek-vocab-leaderboard.firebaseapp.com",
  projectId: "greek-vocab-leaderboard",
  storageBucket: "greek-vocab-leaderboard.firebasestorage.app",
  messagingSenderId: "473409624300",
  appId: "1:473409624300:web:8288c792af4f3c32586dc9"
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const auth = getAuth(fbApp);

const EMAIL_DOMAIN = "@greek-vocab.app";

// ── Auth ──────────────────────────────────────────────────────────────────────

function toEmail(username) {
  return `${username.toLowerCase().trim()}${EMAIL_DOMAIN}`;
}

async function checkUsernameTaken(username) {
  try {
    const snap = await getDoc(doc(db, "usernames", username.toLowerCase().trim()));
    return snap.exists();
  } catch { return false; }
}

async function checkDisplayNameTaken(displayName) {
  try {
    const snap = await getDoc(doc(db, "displayNames", displayName.toLowerCase().trim()));
    return snap.exists();
  } catch { return false; }
}

async function createAccount(username, password, displayName, migrationData = {}) {
  const cred = await createUserWithEmailAndPassword(auth, toEmail(username), password);
  const uid = cred.user.uid;
  const joinDate = migrationData.joinDate || new Date().toISOString();

  await Promise.all([
    setDoc(doc(db, "usernames", username.toLowerCase().trim()), { uid }),
    setDoc(doc(db, "displayNames", displayName.toLowerCase().trim()), { uid, displayName })
  ]);

  const userData = {
    username,
    displayName,
    joinDate,
    xp: migrationData.xp || 0,
    color: migrationData.color || "#d4a93a",
    greekExperience: migrationData.greekExperience || "new",
    avatar: migrationData.avatar || "school",
    streak: migrationData.streak || 0,
    lastStudyDate: migrationData.lastStudyDate || null,
    totalStudySeconds: migrationData.totalStudySeconds || 0,
    completedLessons: migrationData.completedLessons || {},
    completedAdvancedLessons: migrationData.completedAdvancedLessons || {},
    knownWords: migrationData.knownWords || [],
    translationProgress: migrationData.translationProgress || {},
    achievements: migrationData.achievements || [],
    practiceToolsUnlocked: migrationData.practiceToolsUnlocked || false,
    lessonMode: migrationData.lessonMode || "basic",
    vocabChapterXP: migrationData.vocabChapterXP || {},
    lbXpJoined: false,
    lbConsJoined: false,
    lbScholarJoined: false,
    lbScholarBest: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", uid), userData);
  return { uid, joinDate, displayName, username };
}

async function login(username, password) {
  const cred = await signInWithEmailAndPassword(auth, toEmail(username), password);
  return cred.user;
}

async function logout() {
  await signOut(auth);
}

async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) return;
  const uid = user.uid;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const { username, displayName } = snap.data();
      await Promise.all([
        deleteDoc(doc(db, "usernames", (username || "").toLowerCase().trim())).catch(() => {}),
        deleteDoc(doc(db, "displayNames", (displayName || "").toLowerCase().trim())).catch(() => {})
      ]);
    }
  } catch {}

  await Promise.all([
    deleteDoc(doc(db, "users", uid)).catch(() => {}),
    deleteDoc(doc(db, "xp_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "scholar_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "consistency_board", uid)).catch(() => {})
  ]);

  await deleteUser(user);
}

function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

async function syncUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.warn("syncUserData:", e); }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function getUserId() {
  return auth.currentUser?.uid || localStorage.getItem("lbUserId") || (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("lbUserId", id);
    return id;
  })();
}

function getAvatar() {
  return localStorage.getItem("profilePicType") === "icon"
    ? (localStorage.getItem("profilePicValue") || "school")
    : "school";
}

function getMeta() {
  return {
    joinDate: localStorage.getItem("appJoinDate") || null,
    studySeconds: Number(localStorage.getItem("totalStudySeconds")) || 0
  };
}

function getLbDisplayName() {
  return localStorage.getItem("authDisplayName") || "Anonymous";
}

async function checkNameTaken(boardName, name) {
  try {
    const q = query(collection(db, boardName), where("name", "==", name), limit(1));
    const snap = await getDocs(q);
    return snap.docs.some(d => d.id !== getUserId());
  } catch { return false; }
}

async function syncXP(xp) {
  if (localStorage.getItem("lbXpJoined") !== "true") return;
  try {
    await setDoc(doc(db, "xp_board", getUserId()), {
      name: getLbDisplayName(), xp, avatar: getAvatar(), ...getMeta(), updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.warn("LB syncXP:", e); }
}

async function syncStreak(streak) {
  if (localStorage.getItem("lbConsJoined") !== "true") return;
  try {
    await setDoc(doc(db, "consistency_board", getUserId()), {
      name: getLbDisplayName(), streak, avatar: getAvatar(), ...getMeta(), updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.warn("LB syncStreak:", e); }
}

async function submitScholarScore(score) {
  if (localStorage.getItem("lbScholarJoined") !== "true") return;
  const best = parseInt(localStorage.getItem("lbScholarBest") || "0");
  if (score <= best) return;
  localStorage.setItem("lbScholarBest", String(score));
  try {
    await setDoc(doc(db, "scholar_board", getUserId()), {
      name: getLbDisplayName(), bestScore: score, avatar: getAvatar(), ...getMeta(), updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.warn("LB submitScholar:", e); }
}

async function joinXPBoard(xp) {
  localStorage.setItem("lbXpJoined", "true");
  await setDoc(doc(db, "xp_board", getUserId()), {
    name: getLbDisplayName(), xp, avatar: getAvatar(), ...getMeta(), updatedAt: serverTimestamp()
  });
}

function joinScholarBoard() {
  localStorage.setItem("lbScholarJoined", "true");
}

async function joinConsistencyBoard(streak) {
  localStorage.setItem("lbConsJoined", "true");
  await setDoc(doc(db, "consistency_board", getUserId()), {
    name: getLbDisplayName(), streak, avatar: getAvatar(), ...getMeta(), updatedAt: serverTimestamp()
  });
}

async function syncAvatar() {
  const avatar = getAvatar();
  const boards = [
    { key: "xp_board", joined: "lbXpJoined" },
    { key: "scholar_board", joined: "lbScholarJoined" },
    { key: "consistency_board", joined: "lbConsJoined" }
  ];
  for (const { key, joined } of boards) {
    if (localStorage.getItem(joined) === "true") {
      try {
        await setDoc(doc(db, key, getUserId()), { avatar }, { merge: true });
      } catch {}
    }
  }
}

async function getBoard(boardName, field, topN = 100) {
  const q = query(collection(db, boardName), orderBy(field, "desc"), limit(topN));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function listenBoard(boardName, field, callback, topN = 100) {
  const q = query(collection(db, boardName), orderBy(field, "desc"), limit(topN));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

async function deleteUserData() {
  const uid = getUserId();
  await Promise.all([
    deleteDoc(doc(db, "xp_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "scholar_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "consistency_board", uid)).catch(() => {})
  ]);
}

async function getUserRanks() {
  const uid = getUserId();
  const boards = [
    { key: "xp_board", field: "xp" },
    { key: "scholar_board", field: "bestScore" },
    { key: "consistency_board", field: "streak" }
  ];
  const ranks = {};
  for (const { key, field } of boards) {
    try {
      const q = query(collection(db, key), orderBy(field, "desc"), limit(200));
      const snap = await getDocs(q);
      const idx = snap.docs.findIndex(d => d.id === uid);
      ranks[key] = idx >= 0 ? idx + 1 : null;
    } catch {
      ranks[key] = null;
    }
  }
  return ranks;
}

window.LB = {
  getUserId,
  checkNameTaken,
  syncXP,
  syncStreak,
  syncAvatar,
  submitScholarScore,
  joinXPBoard,
  joinScholarBoard,
  joinConsistencyBoard,
  getBoard,
  listenBoard,
  deleteUserData,
  getUserRanks,
  isXpJoined: () => localStorage.getItem("lbXpJoined") === "true",
  isScholarJoined: () => localStorage.getItem("lbScholarJoined") === "true",
  isConsJoined: () => localStorage.getItem("lbConsJoined") === "true"
};

window.Auth = {
  createAccount,
  login,
  logout,
  deleteAccount,
  onAuthChange,
  getCurrentUser,
  loadUserData,
  syncUserData,
  checkUsernameTaken,
  checkDisplayNameTaken
};

// Notify app.js when Firebase auth state is resolved
onAuthStateChanged(auth, user => {
  if (typeof window.__onAuthStateReady === "function") {
    window.__onAuthStateReady(user);
  } else {
    window.__pendingAuthUser = user;
    window.__pendingAuthResolved = true;
  }
});
