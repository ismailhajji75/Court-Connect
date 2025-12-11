// src/utils/email.js
import { notifications } from "../data/mock.js";

let nextNotificationId = 1;

export const sendEmail = (to, subject, message) => {
  const notification = {
    id: nextNotificationId++,
    to,
    subject,
    message,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);

  console.log("📧 AUI EMAIL SENT:", notification);
};
