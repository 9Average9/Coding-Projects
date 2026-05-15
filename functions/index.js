const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Runs every 15 minutes; sends reminders to users whose local time matches their reminder time.
exports.sendScheduledReminders = onSchedule("every 15 minutes", async () => {
  const now = new Date();

  const snap = await db.collection("users")
    .where("reminder.enabled", "==", true)
    .get();

  if (snap.empty) return;

  const sends = [];

  for (const userDoc of snap.docs) {
    const data = userDoc.data();
    const reminder = data.reminder || {};
    const tokens = data.fcmTokens || [];

    if (!tokens.length || !reminder.time) continue;

    const tz = reminder.timezone || "UTC";
    const freq = reminder.frequency || "daily";

    // Get current time in user's timezone
    const localStr = now.toLocaleString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short" });
    // localStr example: "Thu, 08:05"
    const parts = localStr.split(", ");
    const weekday = parts[0]; // "Mon", "Tue", etc.
    const timePart = parts[1]; // "08:05"

    // Check frequency
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
    const isWeekend = ["Sat", "Sun"].includes(weekday);
    if (freq === "weekdays" && !isWeekday) continue;
    if (freq === "weekends" && !isWeekend) continue;

    // Check if reminder time is within this 15-min window
    const [rh, rm] = reminder.time.split(":").map(Number);
    const [ch, cm] = timePart.split(":").map(Number);
    const reminderMinutes = rh * 60 + rm;
    const currentMinutes = ch * 60 + cm;
    const windowMin = currentMinutes % 15 === 0 ? currentMinutes : Math.floor(currentMinutes / 15) * 15;

    if (reminderMinutes < windowMin || reminderMinutes >= windowMin + 15) continue;

    // Check lastSent — don't send more than once per day
    if (reminder.lastSent) {
      const lastSentDate = reminder.lastSent.toDate();
      const lastLocal = lastSentDate.toLocaleDateString("en-US", { timeZone: tz });
      const todayLocal = now.toLocaleDateString("en-US", { timeZone: tz });
      if (lastLocal === todayLocal) continue;
    }

    sends.push({ uid: userDoc.id, tokens, ref: userDoc.ref });
  }

  for (const { uid, tokens, ref } of sends) {
    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "Time to study Greek!",
          body: "Take a few minutes to review your vocabulary and lessons."
        },
        webpush: {
          notification: { icon: "/Greek-Vocab/icon-192.png" }
        }
      });
      await ref.update({ "reminder.lastSent": now });
    } catch (e) {
      console.warn(`Failed to send reminder for ${uid}:`, e.message);
    }
  }
});

// Triggers when a new encouragement message doc is created.
exports.onEncouragementCreated = onDocumentCreated(
  "encouragements/{targetUid}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { fromName, processed } = snap.data();
    if (processed) return;

    const targetUid = event.params.targetUid;

    const userSnap = await db.collection("users").doc(targetUid).get();
    if (!userSnap.exists) return;

    const tokens = userSnap.data().fcmTokens || [];
    if (!tokens.length) {
      await snap.ref.update({ processed: true });
      return;
    }

    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "Study reminder from a friend!",
          body: `${fromName} is reminding you to study your Greek!`
        },
        webpush: {
          notification: { icon: "/Greek-Vocab/icon-192.png" }
        }
      });
    } catch (e) {
      console.warn("sendEachForMulticast failed:", e.message);
    }

    await snap.ref.update({ processed: true });
  }
);
