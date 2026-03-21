import express from "express"
import Stripe from "stripe"
import { protect } from "../middleware/auth.js"
import Booking from "../models/Booking.js"
import Car from "../models/Car.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const paymentRouter = express.Router()

// Create payment intent — before booking is created
paymentRouter.post("/create-payment-intent", protect, async (req, res) => {
    try {
        const { carId, pickupDate, returnDate } = req.body

        const car = await Car.findById(carId)
        if (!car) {
            return res.json({ success: false, message: "Car not found" })
        }

        const picked = new Date(pickupDate)
        const returned = new Date(returnDate)
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const bookingPrice = car.pricePerDay * noOfDays
        const securityDeposit = car.securityDeposit || 0
        const totalAmount = bookingPrice + securityDeposit

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100,
            currency: "inr",
            metadata: {
                carId: carId.toString(),
                userId: req.user._id.toString(),
                pickupDate,
                returnDate
            }
        })

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            totalAmount,
            bookingPrice,
            securityDeposit
        })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
})

// Confirm payment — create booking after payment succeeds
paymentRouter.post("/confirm-payment", protect, async (req, res) => {
    try {
        const { carId, pickupDate, returnDate, paymentIntentId } = req.body

        const car = await Car.findById(carId)
        if (!car) {
            return res.json({ success: false, message: "Car not found" })
        }

        const picked = new Date(pickupDate)
        const returned = new Date(returnDate)
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const price = car.pricePerDay * noOfDays

        const booking = await Booking.create({
            car: carId,
            owner: car.owner,
            user: req.user._id,
            pickupDate,
            returnDate,
            price,
            paymentId: paymentIntentId,
            paymentStatus: "paid"
        })

        res.json({ success: true, message: "Booking confirmed", booking })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
})

export default paymentRouter