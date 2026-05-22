const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

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

    const snap = await db.collection("users")
      .where("reminder.enabled", "==", true)
      .where("reminder.nextSendAt", "<=", now)
      .limit(100)
      .get();

    if (snap.empty) return null;

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

    return null;
  });

exports.onUserReminderWritten = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change) => {
    if (!change.after.exists) return null;
    const before = change.before.exists ? (change.before.data().reminder || {}) : {};
    const after = change.after.data().reminder || {};
    if (!after.enabled || !after.time) return null;

    const scheduleChanged =
      before.enabled !== after.enabled ||
      before.time !== after.time ||
      before.frequency !== after.frequency ||
      before.timezone !== after.timezone;

    if (!scheduleChanged && after.nextSendAt) return null;

    const nextSendAt = calculateNextReminderDate(after);
    if (!nextSendAt) return null;
    await change.after.ref.update({ "reminder.nextSendAt": nextSendAt });
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
      const result = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: { notification: { icon: "/Greek-Vocab/icon-192.png", vibrate: [200, 100, 200] } }
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
