import express from "express"
import Stripe from "stripe"
import { protect } from "../middleware/auth.js"
import Booking from "../models/Booking.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const paymentRouter = express.Router()

// Create payment intent
paymentRouter.post("/create-payment-intent", protect, async (req, res) => {
    try {
        const { bookingId } = req.body

        const booking = await Booking.findById(bookingId).populate("car")

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" })
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.json({ success: false, message: "Unauthorized" })
        }

        const totalAmount = booking.price + (booking.car.securityDeposit || 0)

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100, // Stripe uses paise
            currency: "inr",
            metadata: {
                bookingId: bookingId.toString(),
                userId: req.user._id.toString()
            }
        })

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            totalAmount,
            bookingPrice: booking.price,
            securityDeposit: booking.car.securityDeposit || 0
        })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
})

// Confirm payment and update booking
paymentRouter.post("/confirm-payment", protect, async (req, res) => {
    try {
        const { bookingId, paymentIntentId } = req.body

        const booking = await Booking.findById(bookingId)

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" })
        }

        booking.paymentId = paymentIntentId
        booking.paymentStatus = "paid"
        await booking.save()

        res.json({ success: true, message: "Payment confirmed" })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
})

export default paymentRouter