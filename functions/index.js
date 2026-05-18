const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Runs every minute; sends reminders to users whose local time exactly matches their reminder time.
exports.sendScheduledReminders = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async () => {
    const now = new Date();

    const snap = await db.collection("users")
      .where("reminder.enabled", "==", true)
      .get();

    if (snap.empty) return null;

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      const reminder = data.reminder || {};
      const tokens = data.fcmTokens || [];

      if (!tokens.length || !reminder.time) continue;

      const tz = reminder.timezone || "UTC";
      const freq = reminder.frequency || "daily";

      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const parts = fmt.formatToParts(now);
      const weekday = parts.find(p => p.type === "weekday")?.value;
      const ch = parseInt(parts.find(p => p.type === "hour")?.value || "0");
      const cm = parseInt(parts.find(p => p.type === "minute")?.value || "0");

      if (!weekday) continue;

      const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
      const isWeekend = ["Sat", "Sun"].includes(weekday);
      if (freq === "weekdays" && !isWeekday) continue;
      if (freq === "weekends" && !isWeekend) continue;

      const [rh, rm] = reminder.time.split(":").map(Number);
      const reminderMinutes = rh * 60 + rm;
      const currentMinutes = ch * 60 + cm;

      if (reminderMinutes !== currentMinutes) continue;

      if (reminder.lastSent) {
        const lastLocal = reminder.lastSent.toDate().toLocaleDateString("en-US", { timeZone: tz });
        const todayLocal = now.toLocaleDateString("en-US", { timeZone: tz });
        if (lastLocal === todayLocal) continue;
      }

      console.log(`Sending reminder to ${userDoc.id} at ${ch}:${String(cm).padStart(2,"0")} ${tz}`);

      // Mark sent before FCM so we always record that the function ran
      await userDoc.ref.update({ "reminder.lastSent": now });

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
    } else if (type === "studyJoinRequest") {
      title = "Study Join Request";
      body = `${fromName} wants to join your study group.`;
    } else if (type === "studyJoinApproved") {
      title = "Study Request Approved!";
      body = `${fromName} approved your request to join their study.`;
    } else {
      title = "Basic Greek study reminder:";
      body = `${fromName} is reminding you to study your Greek!`;
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
