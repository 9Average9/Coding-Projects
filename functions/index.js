const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Runs every 15 minutes; sends reminders to users whose local time matches their reminder time.
exports.sendScheduledReminders = functions.pubsub
  .schedule("every 15 minutes")
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

      const localStr = now.toLocaleString("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        weekday: "short"
      });
      const parts = localStr.split(", ");
      const weekday = parts[0];
      const timePart = parts[1];

      const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
      const isWeekend = ["Sat", "Sun"].includes(weekday);
      if (freq === "weekdays" && !isWeekday) continue;
      if (freq === "weekends" && !isWeekend) continue;

      const [rh, rm] = reminder.time.split(":").map(Number);
      const [ch, cm] = timePart.split(":").map(Number);
      const reminderMinutes = rh * 60 + rm;
      const currentMinutes = ch * 60 + cm;
      const windowStart = Math.floor(currentMinutes / 15) * 15;

      if (reminderMinutes < windowStart || reminderMinutes >= windowStart + 15) continue;

      if (reminder.lastSent) {
        const lastLocal = reminder.lastSent.toDate().toLocaleDateString("en-US", { timeZone: tz });
        const todayLocal = now.toLocaleDateString("en-US", { timeZone: tz });
        if (lastLocal === todayLocal) continue;
      }

      try {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: "Time to study Greek!",
            body: "Take a few minutes to review your vocabulary and lessons."
          },
          webpush: { notification: { icon: "/Greek-Vocab/icon-192.png" } }
        });
        await userDoc.ref.update({ "reminder.lastSent": now });
      } catch (e) {
        console.warn(`Reminder failed for ${userDoc.id}:`, e.message);
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
    } else {
      title = "Study reminder from a friend!";
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
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: { notification: { icon: "/Greek-Vocab/icon-192.png" } }
      });
    } catch (e) {
      console.warn("sendEachForMulticast failed:", e.message);
    }

    await snap.ref.update({ processed: true });
    return null;
  });
