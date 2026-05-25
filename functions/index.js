const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();
const bucket = getStorage().bucket();

async function deleteStoragePath(path) {
  if (!path) return;
  try { await bucket.file(path).delete({ ignoreNotFound: true }); }
  catch (e) { console.warn("deleteStoragePath:", path, e.message); }
}

async function shareRecentCommunityPostsBetweenFriends(uidA, uidB) {
  if (!uidA || !uidB) return;
  const now = Date.now();
  const pairs = [
    { authorUid: uidA, newAudienceUid: uidB },
    { authorUid: uidB, newAudienceUid: uidA }
  ];

  for (const pair of pairs) {
    const snap = await db.collection("communityPosts")
      .where("authorUid", "==", pair.authorUid)
      .limit(30)
      .get();

    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(doc => {
      const post = doc.data();
      if (post.isActive === false) return;
      if (post.expiresAtMs && post.expiresAtMs <= now) return;
      batch.update(doc.ref, { audienceUids: FieldValue.arrayUnion(pair.newAudienceUid) });
      count += 1;
    });
    if (count) await batch.commit();
  }
}

async function deleteQueryInBatches(query, batchSize = 250) {
  const snap = await query.limit(batchSize).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  if (snap.size === batchSize) return deleteQueryInBatches(query, batchSize);
}

async function cleanupDeletedUserData(uid) {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.exists ? userSnap.data() : {};
  const username = (userData.username || "").toLowerCase().trim();
  const displayName = (userData.displayName || "").toLowerCase().trim();

  const baseBatch = db.batch();
  if (username) baseBatch.delete(db.collection("usernames").doc(username));
  if (displayName) baseBatch.delete(db.collection("displayNames").doc(displayName));
  baseBatch.delete(userRef);
  baseBatch.delete(db.collection("xp_board").doc(uid));
  baseBatch.delete(db.collection("scholar_board").doc(uid));
  baseBatch.delete(db.collection("consistency_board").doc(uid));
  await baseBatch.commit();

  const friendSnap = await db.collection("users")
    .where("friends", "array-contains", uid)
    .limit(300)
    .get();
  if (!friendSnap.empty) {
    const batch = db.batch();
    friendSnap.docs.forEach(doc => batch.update(doc.ref, {
      friends: FieldValue.arrayRemove(uid),
      friendRequestsIn: FieldValue.arrayRemove(uid),
      friendRequestsOut: FieldValue.arrayRemove(uid),
      updatedAt: FieldValue.serverTimestamp()
    }));
    await batch.commit();
  }

  await deleteQueryInBatches(db.collection("encouragements").doc(uid).collection("messages"));

  const authoredPosts = await db.collection("communityPosts")
    .where("authorUid", "==", uid)
    .limit(300)
    .get();
  if (!authoredPosts.empty) {
    const batch = db.batch();
    authoredPosts.docs.forEach(doc => batch.update(doc.ref, {
      isActive: false,
      deletedAt: FieldValue.serverTimestamp()
    }));
    await batch.commit();
  }

  const audiencePosts = await db.collection("communityPosts")
    .where("audienceUids", "array-contains", uid)
    .limit(300)
    .get();
  if (!audiencePosts.empty) {
    const batch = db.batch();
    let count = 0;
    audiencePosts.docs.forEach(doc => {
      if (doc.data().authorUid === uid) return;
      batch.update(doc.ref, {
        [`reactions.${uid}`]: FieldValue.delete(),
        [`prayers.${uid}`]: FieldValue.delete()
      });
      count += 1;
    });
    if (count) await batch.commit();
  }

  const mercyPosts = await db.collection("merciesPosts")
    .where("audienceUids", "array-contains", uid)
    .limit(300)
    .get();
  if (!mercyPosts.empty) {
    const batch = db.batch();
    const storageDeletes = [];
    let count = 0;
    mercyPosts.docs.forEach(doc => {
      if (doc.data().authorUid === uid) {
        storageDeletes.push(deleteStoragePath(doc.data().imagePath));
        batch.update(doc.ref, {
          isActive: false,
          deletedAt: FieldValue.serverTimestamp()
        });
      } else {
        batch.update(doc.ref, { [`reactions.${uid}`]: FieldValue.delete() });
      }
      count += 1;
    });
    if (count) await batch.commit();
    await Promise.all(storageDeletes);
  }
  await deleteQueryInBatches(db.collection("users").doc(uid).collection("merciesJournal"));


  const comments = await db.collectionGroup("comments")
    .where("authorUid", "==", uid)
    .limit(300)
    .get();
  if (!comments.empty) {
    const batch = db.batch();
    comments.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  const studies = await db.collection("studies")
    .where("collaboratorUids", "array-contains", uid)
    .limit(300)
    .get();
  for (const studyDoc of studies.docs) {
    const study = studyDoc.data();
    if (study.creatorUid !== uid) {
      await studyDoc.ref.update({
        collaboratorUids: FieldValue.arrayRemove(uid),
        pendingCollaboratorUids: FieldValue.arrayRemove(uid)
      });
      continue;
    }

    for (const sub of ["notes", "entries", "savedVerses", "wordLog", "trails"]) {
      await deleteQueryInBatches(studyDoc.ref.collection(sub));
    }
    await studyDoc.ref.delete();
  }
}

exports.cleanupDeletedAuthUser = functions.auth.user().onDelete(async user => {
  await cleanupDeletedUserData(user.uid);
  return null;
});

exports.cleanupExpiredMercies = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = Date.now();
    const snap = await db.collection("merciesPosts")
      .where("expiresAtMs", "<=", now)
      .limit(100)
      .get();
    if (snap.empty) return null;

    const batch = db.batch();
    for (const doc of snap.docs) {
      const post = doc.data();
      const hasJournal = (post.journalSavedBy || []).length > 0;
      if (hasJournal) {
        batch.update(doc.ref, {
          isActive: false,
          expiredAt: FieldValue.serverTimestamp()
        });
      } else {
        await deleteStoragePath(post.imagePath);
        batch.delete(doc.ref);
      }
    }
    await batch.commit();
    return null;
  });

function getLocalParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const pick = type => parts.find(p => p.type === type)?.value;
  const hour = Number(pick("hour"));
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    weekday: pick("weekday"),
    hour: hour === 24 ? 0 : hour,
    minute: Number(pick("minute"))
  };
}

function zonedTimeToUtc({ year, month, day, hour, minute }, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const localAtGuess = getLocalParts(new Date(utcGuess), timeZone);
  const localAsUtc = Date.UTC(
    localAtGuess.year,
    localAtGuess.month - 1,
    localAtGuess.day,
    localAtGuess.hour,
    localAtGuess.minute
  );
  return new Date(utcGuess - (localAsUtc - utcGuess));
}

function reminderAllowsWeekday(frequency, weekday) {
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  const isWeekend = ["Sat", "Sun"].includes(weekday);
  if (frequency === "weekdays") return isWeekday;
  if (frequency === "weekends") return isWeekend;
  return true;
}

function calculateNextReminderDate(reminder, afterDate = new Date()) {
  const [hour, minute] = String(reminder.time || "").split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;

  const timeZone = reminder.timezone || "UTC";
  const frequency = reminder.frequency || "daily";
  const base = getLocalParts(afterDate, timeZone);

  for (let offset = 0; offset <= 8; offset++) {
    const localDay = new Date(Date.UTC(base.year, base.month - 1, base.day + offset));
    const candidate = zonedTimeToUtc({
      year: localDay.getUTCFullYear(),
      month: localDay.getUTCMonth() + 1,
      day: localDay.getUTCDate(),
      hour,
      minute
    }, timeZone);
    const candidateLocal = getLocalParts(candidate, timeZone);
    if (!reminderAllowsWeekday(frequency, candidateLocal.weekday)) continue;
    if (candidate > afterDate) return candidate;
  }
  return null;
}

function calculateNextMercyFriendDate(reminder, afterDate = new Date()) {
  const base = new Date(afterDate.getTime() + (1 + Math.floor(Math.random() * 7)) * 86400000);
  return calculateNextReminderDate({ ...reminder, frequency: "daily" }, base);
}

async function backfillReminderNextSendAt(now) {
  if (now.getUTCMinutes() !== 0) return;
  const snap = await db.collection("users")
    .where("reminder.enabled", "==", true)
    .limit(500)
    .get();
  if (snap.empty) return;

  const batch = db.batch();
  let updates = 0;
  snap.docs.forEach(userDoc => {
    const reminder = userDoc.data().reminder || {};
    if (reminder.nextSendAt || !reminder.time) return;
    const nextSendAt = calculateNextReminderDate(reminder, now);
    if (!nextSendAt) return;
    batch.update(userDoc.ref, { "reminder.nextSendAt": nextSendAt });
    updates++;
  });

  if (updates) {
    await batch.commit();
    console.log(`Backfilled nextSendAt for ${updates} reminder users`);
  }
}

// Runs every minute, but only reads users whose reminder.nextSendAt is due.
exports.sendScheduledReminders = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = new Date();
    await backfillReminderNextSendAt(now);
    await backfillMercyReminderNextSendAt(now);

    const snap = await db.collection("users")
      .where("reminder.enabled", "==", true)
      .where("reminder.nextSendAt", "<=", now)
      .limit(100)
      .get();

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const reminder = data.reminder || {};
      const tokens = data.fcmTokens || [];

      if (!reminder.time) {
        await userDoc.ref.update({ "reminder.enabled": false });
        continue;
      }

      const nextSendAt = calculateNextReminderDate(reminder, new Date(now.getTime() + 60 * 1000));
      if (!tokens.length) {
        if (nextSendAt) await userDoc.ref.update({ "reminder.nextSendAt": nextSendAt });
        continue;
      }

      console.log(`Sending reminder to ${userDoc.id}`);

      const update = { "reminder.lastSent": now };
      if (nextSendAt) update["reminder.nextSendAt"] = nextSendAt;
      await userDoc.ref.update(update);

      try {
        const result = await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: "Time to study Greek!",
            body: "Take a few minutes to review your vocabulary and lessons."
          },
          webpush: { notification: { icon: "/Greek-Vocab/icon-192.png", vibrate: [200, 100, 200] } }
        });
        console.log(`${userDoc.id}: ${result.successCount} sent, ${result.failureCount} failed`);
        result.responses.forEach((r, i) => {
          if (!r.success) console.warn(`token[${i}]:`, r.error?.code, r.error?.message);
        });
      } catch (e) {
        console.error(`${userDoc.id} FCM error:`, e.message);
      }
    }

    const mercyDailySnap = await db.collection("users")
      .where("mercyReminder.enabled", "==", true)
      .where("mercyReminder.nextSendAt", "<=", now)
      .limit(100)
      .get();

    for (const userDoc of mercyDailySnap.docs) {
      const data = userDoc.data();
      const reminder = data.mercyReminder || {};
      const tokens = data.fcmTokens || [];
      const nextSendAt = calculateNextReminderDate(reminder, new Date(now.getTime() + 60 * 1000));
      await userDoc.ref.update({ "mercyReminder.lastSent": now, ...(nextSendAt ? { "mercyReminder.nextSendAt": nextSendAt } : {}) });
      if (!tokens.length) continue;
      const bodies = [
        "Take a moment to remember today's mercy.",
        "What good gift can you thank God for today?",
        "Capture one ordinary blessing from today.",
        "Pause and remember the Lord's kindness today."
      ];
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title: "Mercies", body: bodies[Math.floor(Math.random() * bodies.length)] },
        webpush: { fcmOptions: { link: "/Greek-Vocab/?open=mercies" }, notification: { icon: "/Greek-Vocab/icon-192.png", vibrate: [200, 100, 200] } }
      }).catch(e => console.error(`${userDoc.id} mercy reminder error:`, e.message));
    }

    const mercyFriendSnap = await db.collection("users")
      .where("mercyFriendReminder.enabled", "==", true)
      .where("mercyFriendReminder.nextSendAt", "<=", now)
      .limit(100)
      .get();

    for (const userDoc of mercyFriendSnap.docs) {
      const data = userDoc.data();
      const reminder = data.mercyFriendReminder || {};
      const tokens = data.fcmTokens || [];
      const friends = data.friends || [];
      const nextSendAt = calculateNextMercyFriendDate(reminder, now);
      await userDoc.ref.update({ "mercyFriendReminder.lastSent": now, ...(nextSendAt ? { "mercyFriendReminder.nextSendAt": nextSendAt } : {}) });
      if (!tokens.length || !friends.length) continue;
      const friendUid = friends[Math.floor(Math.random() * friends.length)];
      const friendSnap = await db.collection("users").doc(friendUid).get();
      const friendName = friendSnap.exists ? (friendSnap.data().displayName || friendSnap.data().username || "a friend") : "a friend";
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title: "Mercies", body: `Encourage ${friendName} this week.` },
        data: { open: "mercies", friendUid, friendName },
        webpush: { fcmOptions: { link: `/Greek-Vocab/?open=mercies&friend=${encodeURIComponent(friendUid)}` }, notification: { icon: "/Greek-Vocab/icon-192.png", vibrate: [200, 100, 200] } }
      }).catch(e => console.error(`${userDoc.id} mercy friend reminder error:`, e.message));
    }

    return null;
  });

async function backfillMercyReminderNextSendAt(now) {
  if (now.getUTCMinutes() !== 0) return;
  const [dailySnap, friendSnap] = await Promise.all([
    db.collection("users").where("mercyReminder.enabled", "==", true).limit(500).get(),
    db.collection("users").where("mercyFriendReminder.enabled", "==", true).limit(500).get()
  ]);
  const batch = db.batch();
  let updates = 0;
  dailySnap.docs.forEach(userDoc => {
    const reminder = userDoc.data().mercyReminder || {};
    if (reminder.nextSendAt || !reminder.time) return;
    const nextSendAt = calculateNextReminderDate(reminder, now);
    if (!nextSendAt) return;
    batch.update(userDoc.ref, { "mercyReminder.nextSendAt": nextSendAt });
    updates++;
  });
  friendSnap.docs.forEach(userDoc => {
    const reminder = userDoc.data().mercyFriendReminder || {};
    if (reminder.nextSendAt || !reminder.time) return;
    const nextSendAt = calculateNextMercyFriendDate(reminder, now);
    if (!nextSendAt) return;
    batch.update(userDoc.ref, { "mercyFriendReminder.nextSendAt": nextSendAt });
    updates++;
  });
  if (updates) {
    await batch.commit();
    console.log(`Backfilled nextSendAt for ${updates} Mercy reminder users`);
  }
}

exports.onUserReminderWritten = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change) => {
    if (!change.after.exists) return null;
    const before = change.before.exists ? (change.before.data().reminder || {}) : {};
    const after = change.after.data().reminder || {};
    const updates = {};
    if (after.enabled && after.time) {
      const scheduleChanged =
        before.enabled !== after.enabled ||
        before.time !== after.time ||
        before.frequency !== after.frequency ||
        before.timezone !== after.timezone;
      if ((scheduleChanged || !after.nextSendAt)) {
        const nextSendAt = calculateNextReminderDate(after);
        if (nextSendAt) updates["reminder.nextSendAt"] = nextSendAt;
      }
    }
    const beforeMercy = change.before.exists ? (change.before.data().mercyReminder || {}) : {};
    const afterMercy = change.after.data().mercyReminder || {};
    if (afterMercy.enabled && afterMercy.time && (beforeMercy.enabled !== afterMercy.enabled || beforeMercy.time !== afterMercy.time || !afterMercy.nextSendAt)) {
      const next = calculateNextReminderDate(afterMercy);
      if (next) updates["mercyReminder.nextSendAt"] = next;
    }
    const beforeFriend = change.before.exists ? (change.before.data().mercyFriendReminder || {}) : {};
    const afterFriend = change.after.data().mercyFriendReminder || {};
    if (afterFriend.enabled && afterFriend.time && (beforeFriend.enabled !== afterFriend.enabled || beforeFriend.time !== afterFriend.time || !afterFriend.nextSendAt)) {
      const next = calculateNextMercyFriendDate(afterFriend);
      if (next) updates["mercyFriendReminder.nextSendAt"] = next;
    }
    if (Object.keys(updates).length) await change.after.ref.update(updates);
    return null;
  });

// Triggers on any new doc in encouragements/{targetUid}/messages/{messageId}.
// Handles: encouragement, friendRequest, friendAccepted notification types.
exports.onEncouragementCreated = functions.firestore
  .document("encouragements/{targetUid}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const { type, fromName, processed } = snap.data();
    if (processed) return null;

    const targetUid = context.params.targetUid;

    let title, body;
    if (type === "friendRequest") {
      title = "New Friend Request";
      body = `${fromName} sent you a friend request.`;
    } else if (type === "friendAccepted") {
      title = "Friend Request Accepted!";
      body = `${fromName} accepted your friend request.`;
      await shareRecentCommunityPostsBetweenFriends(targetUid, snap.data().fromUid);
    } else if (type === "studySession") {
      const studyName = snap.data().studyName || "Greek";
      title = "Studying Now 📖";
      body = `${fromName} is studying ${studyName} right now!`;
    } else if (type === "studyCollabRequest") {
      const studyName = snap.data().studyName || "a study";
      title = "Study Join Request";
      body = `${fromName} wants to join your "${studyName}" study.`;
    } else if (type === "studyCollabApproved") {
      const studyName = snap.data().studyName || "a study";
      title = "Study Request Approved!";
      body = `${fromName} approved your request to join "${studyName}".`;
    } else if (type === "studyInvite") {
      const studyName = snap.data().studyName || "a study";
      title = "Study Invitation";
      body = `${fromName} invited you to join "${studyName}".`;
    } else if (type === "communityPost") {
      const kind = snap.data().postKind || "post";
      const labels = { insight: "an insight", question: "a question", encouragement: "an encouragement", prayer: "a prayer post" };
      title = "New Community Post";
      body = `${fromName} shared ${labels[kind] || "a post"} with you.`;
    } else if (type === "postReaction") {
      const postTitle = snap.data().postTitle || "your post";
      const emoji = snap.data().emoji || "reacted";
      title = "Someone Reacted";
      body = `${fromName} reacted ${emoji} to "${postTitle}".`;
    } else if (type === "postComment") {
      const postTitle = snap.data().postTitle || "your post";
      title = "New Comment";
      body = `${fromName} commented on "${postTitle}".`;
    } else if (type === "postPrayer") {
      const postTitle = snap.data().postTitle || "your prayer post";
      title = "They Prayed For You";
      body = `${fromName} prayed for your "${postTitle}" post.`;
    } else if (type === "mercyPostedTagged") {
      title = "New Mercy";
      body = `${fromName} posted a Mercy about you.`;
    } else if (type === "mercyComment") {
      const postTitle = snap.data().postTitle || "your Mercy";
      title = "New Mercy Comment";
      body = `${fromName} commented on "${postTitle}".`;
    } else if (type === "encouragement") {
      title = "Study Encouragement";
      body = `${fromName} is encouraging you to study your Greek!`;
    } else {
      return null; // unknown type — don't send a misleading notification
    }

    const userSnap = await db.collection("users").doc(targetUid).get();
    if (!userSnap.exists) {
      await snap.ref.update({ processed: true });
      return null;
    }

    const tokens = userSnap.data().fcmTokens || [];
    if (!tokens.length) {
      await snap.ref.update({ processed: true });
      return null;
    }

    try {
      const webpush = { notification: { icon: "/Greek-Vocab/icon-192.png", vibrate: [200, 100, 200] } };
      if (type && String(type).startsWith("mercy")) webpush.fcmOptions = { link: "/Greek-Vocab/?open=mercies" };
      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush
      });
      console.log(`onEncouragementCreated ${targetUid}: ${result.successCount} sent, ${result.failureCount} failed`);
      result.responses.forEach((r, i) => {
        if (!r.success) console.warn(`token[${i}]:`, r.error?.code, r.error?.message);
      });
    } catch (e) {
      console.error("sendEachForMulticast threw:", e.message);
    }

    await snap.ref.update({ processed: true });
    return null;
  });
