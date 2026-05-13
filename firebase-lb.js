import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

function getUserId() {
  let uid = localStorage.getItem("lbUserId");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("lbUserId", uid);
  }
  return uid;
}

async function syncXP(xp) {
  if (localStorage.getItem("lbXpJoined") !== "true") return;
  const name = localStorage.getItem("lbXpName");
  if (!name) return;
  try {
    await setDoc(doc(db, "xp_board", getUserId()), { name, xp, updatedAt: serverTimestamp() });
  } catch (e) { console.warn("LB syncXP:", e); }
}

async function syncStreak(streak) {
  if (localStorage.getItem("lbConsJoined") !== "true") return;
  const name = localStorage.getItem("lbConsName");
  if (!name) return;
  try {
    await setDoc(doc(db, "consistency_board", getUserId()), { name, streak, updatedAt: serverTimestamp() });
  } catch (e) { console.warn("LB syncStreak:", e); }
}

async function submitScholarScore(score) {
  if (localStorage.getItem("lbScholarJoined") !== "true") return;
  const name = localStorage.getItem("lbScholarName");
  if (!name) return;
  const best = parseInt(localStorage.getItem("lbScholarBest") || "0");
  if (score <= best) return;
  localStorage.setItem("lbScholarBest", String(score));
  try {
    await setDoc(doc(db, "scholar_board", getUserId()), { name, bestScore: score, updatedAt: serverTimestamp() });
  } catch (e) { console.warn("LB submitScholar:", e); }
}

async function joinXPBoard(name, xp) {
  localStorage.setItem("lbXpJoined", "true");
  localStorage.setItem("lbXpName", name);
  await setDoc(doc(db, "xp_board", getUserId()), { name, xp, updatedAt: serverTimestamp() });
}

function joinScholarBoard(name) {
  localStorage.setItem("lbScholarJoined", "true");
  localStorage.setItem("lbScholarName", name);
}

async function joinConsistencyBoard(name, streak) {
  localStorage.setItem("lbConsJoined", "true");
  localStorage.setItem("lbConsName", name);
  await setDoc(doc(db, "consistency_board", getUserId()), { name, streak, updatedAt: serverTimestamp() });
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
    } catch (e) {
      ranks[key] = null;
    }
  }
  return ranks;
}

window.LB = {
  getUserId,
  syncXP,
  syncStreak,
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
