import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVWKRCtjg7ppR-D8ZNs-TfSwPlWdXXQ5Q",
  authDomain: "greek-vocab-leaderboard.firebaseapp.com",
  projectId: "greek-vocab-leaderboard",
  storageBucket: "greek-vocab-leaderboard.firebasestorage.app",
  messagingSenderId: "473409624300",
  appId: "1:473409624300:web:8288c792af4f3c32586dc9"
};

const fbApp = initializeApp(firebaseConfig);
const db = initializeFirestore(fbApp, { localCache: persistentLocalCache() });
const auth = getAuth(fbApp);
let messaging = null;
try { messaging = getMessaging(fbApp); } catch (e) { console.warn("FCM unavailable:", e); }

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
    lbXpJoined: migrationData.lbXpJoined || false,
    lbConsJoined: migrationData.lbConsJoined || false,
    lbScholarJoined: migrationData.lbScholarJoined || false,
    lbScholarBest: migrationData.lbScholarBest || 0,
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

async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) return;
  const uid = user.uid;

  const username = localStorage.getItem("authUsername") || "";
  const credential = EmailAuthProvider.credential(toEmail(username), password);
  await reauthenticateWithCredential(user, credential);

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const { username: u, displayName } = snap.data();
      await Promise.all([
        deleteDoc(doc(db, "usernames", (u || "").toLowerCase().trim())).catch(() => {}),
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

function listenUserDoc(uid, callback) {
  return onSnapshot(doc(db, "users", uid), snap => {
    if (snap.exists()) callback(snap.data());
  });
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
  return localStorage.getItem("authDisplayName") || localStorage.getItem("authUsername") || "Anonymous";
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
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { console.warn("listenBoard:", boardName, err); callback(null, err); }
  );
}

async function deleteUserData() {
  const uid = getUserId();
  await Promise.all([
    deleteDoc(doc(db, "xp_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "scholar_board", uid)).catch(() => {}),
    deleteDoc(doc(db, "consistency_board", uid)).catch(() => {})
  ]);
}

async function deleteEntriesForId(uid) {
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
    { key: "scholar_board", field: "bestScore" }
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

// ── Friends ───────────────────────────────────────────────────────────────────

async function frGetAllUsers(currentUid) {
  try {
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(60));
    const snap = await getDocs(q);
    return snap.docs
      .filter(d => d.id !== currentUid)
      .map(d => ({ uid: d.id, ...d.data() }));
  } catch { return []; }
}

async function frSearchUsers(searchQuery, currentUid) {
  try {
    const end = searchQuery + "";
    const q = query(
      collection(db, "users"),
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", end),
      limit(30)
    );
    const snap = await getDocs(q);
    return snap.docs
      .filter(d => d.id !== currentUid)
      .map(d => ({ uid: d.id, ...d.data() }));
  } catch { return []; }
}

async function frGetUser(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
  } catch { return null; }
}

async function frSendRequest(fromUid, toUid, fromName) {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", fromUid), { friendRequestsOut: arrayUnion(toUid),   updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "users", toUid),   { friendRequestsIn:  arrayUnion(fromUid), updatedAt: serverTimestamp() })
    ]);
    if (fromName) fcmSendPushNotification(toUid, "friendRequest", fromName, fromUid);
    return true;
  } catch { return false; }
}

async function frCancelRequest(fromUid, toUid) {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", fromUid), { friendRequestsOut: arrayRemove(toUid),   updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "users", toUid),   { friendRequestsIn:  arrayRemove(fromUid), updatedAt: serverTimestamp() })
    ]);
    return true;
  } catch { return false; }
}

async function frAcceptRequest(uid, fromUid, myName) {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", uid),     { friendRequestsIn:  arrayRemove(fromUid), friends: arrayUnion(fromUid), updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "users", fromUid), { friendRequestsOut: arrayRemove(uid),     friends: arrayUnion(uid),     updatedAt: serverTimestamp() })
    ]);
    if (myName) fcmSendPushNotification(fromUid, "friendAccepted", myName, uid);
    return true;
  } catch { return false; }
}

async function frDeclineRequest(uid, fromUid) {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", uid),     { friendRequestsIn:  arrayRemove(fromUid), updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "users", fromUid), { friendRequestsOut: arrayRemove(uid),     updatedAt: serverTimestamp() })
    ]);
    return true;
  } catch { return false; }
}

async function frRemoveFriend(uid, friendUid) {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", uid),       { friends: arrayRemove(friendUid), updatedAt: serverTimestamp() }),
      updateDoc(doc(db, "users", friendUid), { friends: arrayRemove(uid),       updatedAt: serverTimestamp() })
    ]);
    return true;
  } catch { return false; }
}

window.Friends = {
  getAllUsers:     frGetAllUsers,
  searchUsers:    frSearchUsers,
  getUser:        frGetUser,
  sendRequest:    frSendRequest,
  cancelRequest:  frCancelRequest,
  acceptRequest:  frAcceptRequest,
  declineRequest: frDeclineRequest,
  removeFriend:   frRemoveFriend
};

// ── FCM ───────────────────────────────────────────────────────────────────────

const FCM_VAPID_KEY = "BDOeDKo0NmW6-kMwJB9noey7YK1u3raQ5NUvfFhv9kguPXDZfJirp5-ilbwwMCm9_0_hQ_EkiQktFe4f2pLl5VU";

// Generic push notification writer — triggers the Cloud Function onEncouragementCreated.
async function fcmSendPushNotification(toUid, type, fromName, fromUid, extra = {}) {
  try {
    await addDoc(collection(db, "encouragements", toUid, "messages"), {
      type, fromName, fromUid, processed: false, createdAt: serverTimestamp(), ...extra
    });
    return true;
  } catch (e) {
    console.warn("fcmSendPushNotification:", e);
    return false;
  }
}

// ── Personal Studies (top-level collection, supports collaboration) ───────────

async function studyCreate(uid, displayName, { name, color, icon, shareSession }) {
  try {
    const ref = await addDoc(collection(db, "studies"), {
      name, color, icon,
      creatorUid: uid, creatorName: displayName,
      collaboratorUids: [uid], pendingCollaboratorUids: [],
      shareSession: !!shareSession,
      createdAt: serverTimestamp(), isActive: true,
      rhemaPositions: {}, lastSessionDates: {}
    });
    await updateDoc(doc(db, "users", uid), { studyIds: arrayUnion(ref.id) });
    return ref.id;
  } catch (e) { console.warn("studyCreate:", e); return null; }
}

async function studyGetMine(uid) {
  try {
    const q = query(collection(db, "studies"),
      where("collaboratorUids", "array-contains", uid), where("isActive", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  } catch (e) { console.warn("studyGetMine:", e); return []; }
}

async function studyGetFriends(friendUids) {
  if (!friendUids?.length) return [];
  try {
    const results = [];
    const seen = new Set();
    for (let i = 0; i < friendUids.length; i += 10) {
      const batch = friendUids.slice(i, i + 10);
      const q = query(collection(db, "studies"),
        where("collaboratorUids", "array-contains-any", batch), where("isActive", "==", true));
      const snap = await getDocs(q);
      snap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); results.push({ id: d.id, ...d.data() }); } });
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) { console.warn("studyGetFriends:", e); return []; }
}

async function studyOpenSession(uid, studyId, { displayName, friendsList }) {
  const today = new Date().toLocaleDateString("en-CA");
  try {
    const ref = doc(db, "studies", studyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const alreadyDone = (data.lastSessionDates || {})[uid] === today;
    if (!alreadyDone) {
      await updateDoc(ref, { [`lastSessionDates.${uid}`]: today });
      if (data.shareSession && friendsList?.length) {
        const notifyUids = friendsList.filter(fuid => !data.collaboratorUids.includes(fuid));
        for (const fuid of notifyUids) {
          fcmSendPushNotification(fuid, "studySession", displayName, uid, { studyName: data.name });
        }
      }
    }
    return { alreadyDone };
  } catch (e) { console.warn("studyOpenSession:", e); }
}

async function studySaveRhemaPos(studyId, uid, book, chapter, verse) {
  try {
    await updateDoc(doc(db, "studies", studyId), {
      [`rhemaPositions.${uid}`]: { book, chapter, verse }
    });
  } catch (e) { console.warn("studySaveRhemaPos:", e); }
}

// Notes
function studyListenNotes(studyId, callback) {
  const q = query(collection(db, "studies", studyId, "notes"), orderBy("createdAt", "asc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { console.warn("studyListenNotes:", err); callback([]); });
}
async function studyAddNote(studyId, uid, displayName, content) {
  try {
    await addDoc(collection(db, "studies", studyId, "notes"), {
      content, authorUid: uid, authorName: displayName, createdAt: serverTimestamp()
    });
    return true;
  } catch (e) { console.warn("studyAddNote:", e); return false; }
}
async function studyDeleteNote(studyId, noteId) {
  try { await deleteDoc(doc(db, "studies", studyId, "notes", noteId)); return true; }
  catch (e) { console.warn("studyDeleteNote:", e); return false; }
}

// Saved Verses
function studyListenVerses(studyId, callback) {
  const q = query(collection(db, "studies", studyId, "savedVerses"), orderBy("savedAt", "asc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { console.warn("studyListenVerses:", err); callback([]); });
}
async function studySaveVerse(studyId, uid, displayName, { book, chapter, verse, bookName }) {
  try {
    await addDoc(collection(db, "studies", studyId, "savedVerses"), {
      book, chapter, verse, bookName, savedByUid: uid, savedByName: displayName, savedAt: serverTimestamp()
    });
    return true;
  } catch (e) { console.warn("studySaveVerse:", e); return false; }
}
async function studyDeleteVerse(studyId, verseId) {
  try { await deleteDoc(doc(db, "studies", studyId, "savedVerses", verseId)); return true; }
  catch (e) { console.warn("studyDeleteVerse:", e); return false; }
}

// Word Log (deduped by Strong's number per study)
function studyListenWordLog(studyId, callback) {
  const q = query(collection(db, "studies", studyId, "wordLog"), orderBy("loggedAt", "asc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => { console.warn("studyListenWordLog:", err); callback([]); });
}
async function studyLogWord(studyId, uid, displayName, { lemma, strongs, definition, surface, translit }) {
  try {
    await setDoc(doc(db, "studies", studyId, "wordLog", String(strongs)), {
      lemma, strongs: String(strongs), definition: definition || '', surface, translit: translit || '',
      loggedByUid: uid, loggedByName: displayName, loggedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) { console.warn("studyLogWord:", e); return false; }
}
async function studyDeleteWordLog(studyId, wordId) {
  try { await deleteDoc(doc(db, "studies", studyId, "wordLog", wordId)); return true; }
  catch (e) { console.warn("studyDeleteWordLog:", e); return false; }
}

// Collaboration
async function studyRequestCollab(studyId, uid, displayName) {
  try {
    const ref = doc(db, "studies", studyId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    await updateDoc(ref, { pendingCollaboratorUids: arrayUnion(uid) });
    fcmSendPushNotification(snap.data().creatorUid, "studyCollabRequest", displayName, uid, { studyId, studyName: snap.data().name });
    return true;
  } catch (e) { console.warn("studyRequestCollab:", e); return false; }
}
async function studyApproveCollab(studyId, requesterUid, requesterName) {
  try {
    const ref = doc(db, "studies", studyId);
    await updateDoc(ref, {
      collaboratorUids: arrayUnion(requesterUid),
      pendingCollaboratorUids: arrayRemove(requesterUid)
    });
    await updateDoc(doc(db, "users", requesterUid), { studyIds: arrayUnion(studyId) });
    const snap = await getDoc(ref);
    const myName = localStorage.getItem("authDisplayName") || "Someone";
    fcmSendPushNotification(requesterUid, "studyCollabApproved", myName, window.Auth?.getCurrentUser()?.uid, { studyId, studyName: snap.data()?.name });
    return true;
  } catch (e) { console.warn("studyApproveCollab:", e); return false; }
}
async function studyDenyCollab(studyId, requesterUid) {
  try {
    await updateDoc(doc(db, "studies", studyId), { pendingCollaboratorUids: arrayRemove(requesterUid) });
    return true;
  } catch (e) { console.warn("studyDenyCollab:", e); return false; }
}

// Copy a study as your own personal copy (no approval needed)
async function studyCopy(sourceStudyId, uid, displayName) {
  try {
    const snap = await getDoc(doc(db, "studies", sourceStudyId));
    if (!snap.exists()) return null;
    const s = snap.data();
    const ref = await addDoc(collection(db, "studies"), {
      name: s.name, color: s.color, icon: s.icon,
      creatorUid: uid, creatorName: displayName,
      collaboratorUids: [uid], pendingCollaboratorUids: [],
      shareSession: s.shareSession ?? false,
      createdAt: serverTimestamp(), isActive: true,
      rhemaPositions: {}, lastSessionDates: {}, copiedFromId: sourceStudyId
    });
    await updateDoc(doc(db, "users", uid), { studyIds: arrayUnion(ref.id) });
    return ref.id;
  } catch (e) { console.warn("studyCopy:", e); return null; }
}

async function studyDeletePermanent(studyId, uid) {
  try {
    await updateDoc(doc(db, "studies", studyId), { isActive: false });
    await updateDoc(doc(db, "users", uid), { studyIds: arrayRemove(studyId) });
    return true;
  } catch (e) { console.warn("studyDeletePermanent:", e); return false; }
}

// Listen for incoming encouragement messages (for in-app notifications)
function listenEncouragements(uid, callback) {
  const q = query(collection(db, "encouragements", uid, "messages"),
    orderBy("createdAt", "desc"), limit(30));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.warn("listenEncouragements:", err));
}

window.Studies = {
  create: studyCreate, getMine: studyGetMine, getFriends: studyGetFriends,
  openSession: studyOpenSession, saveRhemaPos: studySaveRhemaPos,
  listenNotes: studyListenNotes, addNote: studyAddNote, deleteNote: studyDeleteNote,
  listenVerses: studyListenVerses, saveVerse: studySaveVerse, deleteVerse: studyDeleteVerse,
  listenWordLog: studyListenWordLog, logWord: studyLogWord, deleteWordLog: studyDeleteWordLog,
  requestCollab: studyRequestCollab, approveCollab: studyApproveCollab, denyCollab: studyDenyCollab,
  copy: studyCopy, delete: studyDeletePermanent, listenEncouragements
};

async function fcmRegisterToken(uid) {
  if (!messaging) throw new Error("Firebase messaging not available on this browser.");
  const reg = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey: FCM_VAPID_KEY,
    serviceWorkerRegistration: reg
  });
  if (token) {
    await setDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) }, { merge: true });
    localStorage.setItem("fcmToken", token);
  }
  return token || null;
}

async function fcmRemoveToken(uid, token) {
  try {
    await setDoc(doc(db, "users", uid), { fcmTokens: arrayRemove(token) }, { merge: true });
    localStorage.removeItem("fcmToken");
  } catch (e) {
    console.warn("fcmRemoveToken:", e);
  }
}

async function fcmSaveReminder(uid, { time, frequency, timezone }) {
  try {
    await setDoc(doc(db, "users", uid), {
      reminder: { enabled: true, time, frequency, timezone, lastSent: null },
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn("fcmSaveReminder:", e);
    return false;
  }
}

async function fcmDisableReminder(uid) {
  try {
    await setDoc(doc(db, "users", uid), {
      reminder: { enabled: false },
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn("fcmDisableReminder:", e);
    return false;
  }
}

async function fcmSendEncouragement(fromUid, fromName, toUid) {
  return fcmSendPushNotification(toUid, "encouragement", fromName, fromUid);
}

function fcmListenForeground(callback) {
  if (messaging) onMessage(messaging, callback);
}

window.FCM = {
  registerToken:     fcmRegisterToken,
  removeToken:       fcmRemoveToken,
  saveReminder:      fcmSaveReminder,
  disableReminder:   fcmDisableReminder,
  sendEncouragement: fcmSendEncouragement,
  listenForeground:  fcmListenForeground
};

async function saveRhemaPosition(uid, pos) {
  try {
    await setDoc(doc(db, "users", uid), { rhemaLastPos: pos }, { merge: true });
  } catch (e) { console.warn("saveRhemaPosition:", e); }
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
  deleteEntriesForId,
  getUserRanks,
  saveRhemaPosition,
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
  checkDisplayNameTaken,
  listenUserDoc
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
