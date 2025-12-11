// src/controllers/payment.controller.js
export const createPaymentIntent = (req, res) => {
  const { bookingId, amount } = req.body || {};

  if (!bookingId || !amount) {
    return res.status(400).json({ error: "bookingId and amount are required" });
  }

  // In a real app you'd integrate with a payment gateway.
  res.json({
    message: "Payment simulated",
    bookingId,
    amount,
    status: "success",
  });
};
//modified