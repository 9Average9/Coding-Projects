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
  onAuthStateChanged
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
async function fcmSendPushNotification(toUid, type, fromName, fromUid) {
  try {
    await addDoc(collection(db, "encouragements", toUid, "messages"), {
      type, fromName, fromUid, processed: false, createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn("fcmSendPushNotification:", e);
    return false;
  }
}

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

// ── Community Study Board ─────────────────────────────────────────────────────

async function csCreateStudy(uid, { type, title, description, greekWord, creatorName, creatorAvatar,
    visibility, color, icon, tags, format, duration, focusRef }) {
  const ref = await addDoc(collection(db, "community_studies"), {
    creatorUid: uid,
    creatorName: creatorName || "User",
    creatorAvatar: creatorAvatar || "person",
    type, title,
    description: description || "",
    greekWord: greekWord || null,
    visibility: visibility || "public",
    color: color || null,
    icon: icon || null,
    tags: tags || [],
    format: format || "casual",
    duration: duration || "ongoing",
    focusRef: focusRef || "",
    createdAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    memberUids: [uid],
    pendingUids: [],
    invitedUids: [],
    contributionCounts: {},
    isActive: true
  });
  return ref.id;
}

function csListenStudies(callback, limitN = 40) {
  // Order by createdAt only — no composite index needed. Filter isActive client-side.
  const q = query(
    collection(db, "community_studies"),
    orderBy("createdAt", "desc"),
    limit(limitN)
  );
  return onSnapshot(
    q,
    snap => callback(snap.docs.filter(d => d.data().isActive !== false).map(d => ({ id: d.id, ...d.data() }))),
    err => { console.warn("listenStudies:", err); callback(null, err); }
  );
}

async function csGetStudy(studyId) {
  try {
    const snap = await getDoc(doc(db, "community_studies", studyId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch { return null; }
}

async function csRequestJoin(studyId, uid, displayName, creatorUid) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), { pendingUids: arrayUnion(uid) });
    fcmSendPushNotification(creatorUid, "studyJoinRequest", displayName, uid);
    return true;
  } catch (e) { console.warn("csRequestJoin:", e); return false; }
}

async function csApproveJoin(studyId, uid, myDisplayName, creatorUid) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), {
      pendingUids: arrayRemove(uid),
      memberUids: arrayUnion(uid)
    });
    fcmSendPushNotification(uid, "studyJoinApproved", myDisplayName, creatorUid);
    return true;
  } catch (e) { console.warn("csApproveJoin:", e); return false; }
}

async function csDenyJoin(studyId, uid) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), { pendingUids: arrayRemove(uid) });
    return true;
  } catch (e) { return false; }
}

async function csLeaveStudy(studyId, uid) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), { memberUids: arrayRemove(uid) });
    return true;
  } catch (e) { return false; }
}

async function csDeleteStudy(studyId) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), { isActive: false });
    return true;
  } catch (e) { return false; }
}

async function csAddContribution(studyId, uid, displayName, avatar, type, text, extra = {}) {
  try {
    await addDoc(collection(db, "community_studies", studyId, "contributions"), {
      uid, displayName, avatar: avatar || "person", type, text,
      reactions: {}, parentId: null, ...extra,
      createdAt: serverTimestamp()
    });
    const updates = { lastActivityAt: serverTimestamp() };
    if (!["joined", "verse", "spotlight"].includes(type)) {
      updates[`contributionCounts.${uid}.total`] = increment(1);
      updates[`contributionCounts.${uid}.${type}s`] = increment(1);
    }
    await updateDoc(doc(db, "community_studies", studyId), updates);
    return true;
  } catch (e) { console.warn("csAddContribution:", e); return false; }
}

async function csGetContributions(studyId, limitN = 60) {
  try {
    return (await getDocs(
      query(collection(db, "community_studies", studyId, "contributions"), limit(limitN))
    )).docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ── Instant join (public / friends-only) ─────────────────────────────────
async function csInstantJoin(studyId, uid, displayName, avatar) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), {
      memberUids: arrayUnion(uid), lastActivityAt: serverTimestamp()
    });
    await addDoc(collection(db, "community_studies", studyId, "contributions"), {
      uid, displayName, avatar: avatar || "person", type: "joined",
      text: `${displayName} joined the study.`,
      reactions: {}, parentId: null, createdAt: serverTimestamp()
    });
    return true;
  } catch (e) { console.warn("csInstantJoin:", e); return false; }
}

// ── Invite / accept (private studies) ────────────────────────────────────
async function csInviteUser(studyId, targetUid, myDisplayName, myUid) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), { invitedUids: arrayUnion(targetUid) });
    fcmSendPushNotification(targetUid, "studyInvite", myDisplayName, myUid);
    return true;
  } catch (e) { return false; }
}

async function csAcceptInvite(studyId, uid, displayName, avatar) {
  try {
    await updateDoc(doc(db, "community_studies", studyId), {
      invitedUids: arrayRemove(uid), memberUids: arrayUnion(uid),
      lastActivityAt: serverTimestamp()
    });
    await addDoc(collection(db, "community_studies", studyId, "contributions"), {
      uid, displayName, avatar: avatar || "person", type: "joined",
      text: `${displayName} joined the study.`,
      reactions: {}, parentId: null, createdAt: serverTimestamp()
    });
    return true;
  } catch (e) { return false; }
}

// ── Reactions ─────────────────────────────────────────────────────────────
async function csToggleReaction(studyId, contribId, uid, emoji) {
  const ref = doc(db, "community_studies", studyId, "contributions", contribId);
  try {
    const snap = await getDoc(ref);
    const voters = (snap.data()?.reactions || {})[emoji] || [];
    const had = voters.includes(uid);
    await updateDoc(ref, { [`reactions.${emoji}`]: had ? arrayRemove(uid) : arrayUnion(uid) });
    return !had;
  } catch (e) { return false; }
}

// ── Polls ─────────────────────────────────────────────────────────────────
async function csAddPoll(studyId, uid, displayName, question, options) {
  try {
    await addDoc(collection(db, "community_studies", studyId, "polls"), {
      uid, displayName, question,
      options: options.map(text => ({ text, voters: [] })),
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "community_studies", studyId), { lastActivityAt: serverTimestamp() });
    return true;
  } catch (e) { return false; }
}

async function csPollVote(studyId, pollId, optionIndex, uid) {
  const ref = doc(db, "community_studies", studyId, "polls", pollId);
  try {
    const snap = await getDoc(ref);
    const options = snap.data()?.options || [];
    const updates = {};
    options.forEach((opt, i) => {
      if ((opt.voters || []).includes(uid)) updates[`options.${i}.voters`] = arrayRemove(uid);
    });
    updates[`options.${optionIndex}.voters`] = arrayUnion(uid);
    await updateDoc(ref, updates);
    return true;
  } catch (e) { return false; }
}

async function csGetPolls(studyId) {
  try {
    return (await getDocs(collection(db, "community_studies", studyId, "polls"))).docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ── Check-ins ─────────────────────────────────────────────────────────────
async function csCheckIn(studyId, uid, displayName) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    await setDoc(doc(db, "community_studies", studyId, "checkins", `${uid}_${today}`), {
      uid, displayName, date: today, ts: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) { return false; }
}

async function csGetCheckIns(studyId) {
  try {
    const q = query(collection(db, "community_studies", studyId, "checkins"), orderBy("date", "desc"), limit(100));
    return (await getDocs(q)).docs.map(d => d.data());
  } catch { return []; }
}

// ── Prayer Requests ───────────────────────────────────────────────────────
async function csAddPrayer(studyId, uid, displayName, text) {
  try {
    await addDoc(collection(db, "community_studies", studyId, "prayers"), {
      uid, displayName, text, answered: false, createdAt: serverTimestamp()
    });
    return true;
  } catch (e) { return false; }
}

async function csPrayerAnswered(studyId, prayerId) {
  try {
    await updateDoc(doc(db, "community_studies", studyId, "prayers", prayerId), { answered: true });
    return true;
  } catch (e) { return false; }
}

async function csGetPrayers(studyId) {
  try {
    return (await getDocs(collection(db, "community_studies", studyId, "prayers"))).docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ── Reading Plan ──────────────────────────────────────────────────────────
async function csSetReadingPlan(studyId, tasks) {
  try {
    await setDoc(doc(db, "community_studies", studyId, "plan", "main"), {
      tasks: tasks.map(label => ({ label, completedBy: [] })),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) { return false; }
}

async function csToggleTask(studyId, taskIndex, uid, isDone) {
  try {
    await updateDoc(doc(db, "community_studies", studyId, "plan", "main"), {
      [`tasks.${taskIndex}.completedBy`]: isDone ? arrayUnion(uid) : arrayRemove(uid)
    });
    return true;
  } catch (e) { return false; }
}

async function csGetReadingPlan(studyId) {
  try {
    const snap = await getDoc(doc(db, "community_studies", studyId, "plan", "main"));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

window.Community = {
  createStudy: csCreateStudy,
  listenStudies: csListenStudies,
  getStudy: csGetStudy,
  requestJoin: csRequestJoin,
  instantJoin: csInstantJoin,
  inviteUser: csInviteUser,
  acceptInvite: csAcceptInvite,
  approveJoin: csApproveJoin,
  denyJoin: csDenyJoin,
  leaveStudy: csLeaveStudy,
  deleteStudy: csDeleteStudy,
  addContribution: csAddContribution,
  getContributions: csGetContributions,
  toggleReaction: csToggleReaction,
  addPoll: csAddPoll,
  pollVote: csPollVote,
  getPolls: csGetPolls,
  checkIn: csCheckIn,
  getCheckIns: csGetCheckIns,
  addPrayer: csAddPrayer,
  prayerAnswered: csPrayerAnswered,
  getPrayers: csGetPrayers,
  setReadingPlan: csSetReadingPlan,
  toggleTask: csToggleTask,
  getReadingPlan: csGetReadingPlan
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
