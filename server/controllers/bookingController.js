import Booking from "../models/Booking.js"
import Car from "../models/Car.js"
import imagekit from "../configs/imagekit.js"

// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate)=>{
    const bookings = await Booking.find({
        car,
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate},
    })
    return bookings.length === 0;
}

// API to Check Availability
export const checkAvailabilityOfCar = async (req, res)=>{
    try {
        const {location, pickupDate, returnDate} = req.body

        const cars = await Car.find({location, isAvaliable: true})

        const availableCarsPromises = cars.map(async (car)=>{
           const isAvailable = await checkAvailability(car._id, pickupDate, returnDate)
           return {...car._doc, isAvailable: isAvailable}
        })

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)

        res.json({success: true, availableCars})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Create Booking
export const createBooking = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate)
        if(!isAvailable){
            return res.json({success: false, message: "Car is not available"})
        }

        const carData = await Car.findById(car)

        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const price = carData.pricePerDay * noOfDays;

        await Booking.create({car, owner: carData.owner, user: _id, pickupDate, returnDate, price})

        res.json({success: true, message: "Booking Created"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// USER BOOKINGS
export const getUserBookings = async (req, res)=>{
    try {
        const {_id} = req.user;

        const bookings = await Booking.find({ user: _id })
            .populate("car")
            .sort({createdAt: -1})

        const now = new Date()

        for (let booking of bookings) {
            if (
                booking.status === "approved" &&
                now > new Date(booking.returnDate)
            ) {
                booking.status = "missed"
                await booking.save()
            }
        }

        res.json({success: true, bookings})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// OWNER BOOKINGS
export const getOwnerBookings = async (req, res)=>{
    try {
        if(req.user.role !== 'owner'){
            return res.json({ success: false, message: "Unauthorized" })
        }

        const bookings = await Booking.find({owner: req.user._id})
            .populate('car user')
            .select("-user.password")
            .sort({createdAt: -1 })

        const now = new Date()

        for (let booking of bookings) {
            if (
                booking.status === "approved" &&
                now > new Date(booking.returnDate)
            ) {
                booking.status = "missed"
                await booking.save()
            }
        }

        res.json({success: true, bookings})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// START RIDE (Save Pre Images)
export const startRide = async (req, res)=>{
    try {
        const {_id} = req.user
        const { bookingId } = req.body

        const booking = await Booking.findById(bookingId)

        if(!booking || booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        // Upload images to ImageKit
        const uploadToImageKit = async (file) => {
            const result = await imagekit.upload({
                file: file.buffer,
                fileName: `${Date.now()}-${file.originalname}`
            })
            return result.url
        }

        const preImages = {
            front: await uploadToImageKit(req.files.front[0]),
            rear: await uploadToImageKit(req.files.rear[0]),
            left: await uploadToImageKit(req.files.left[0]),
            right: await uploadToImageKit(req.files.right[0])
        }

        booking.preInspectionImages = preImages
        booking.status = "active"

        await booking.save()

        res.json({ success: true, message: "Ride Started" })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// END RIDE (Compare + Run TrustShield)
export const endRide = async (req, res)=>{
    try {
        const {_id} = req.user
        const { bookingId } = req.body

        const booking = await Booking.findById(bookingId)

        if(!booking || booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        const uploadToImageKit = async (file) => {
            const result = await imagekit.upload({
                file: file.buffer,
                fileName: `${Date.now()}-${file.originalname}`
            })
            return result.url
        }

        const postImages = {
            front: await uploadToImageKit(req.files.front[0]),
            rear: await uploadToImageKit(req.files.rear[0]),
            left: await uploadToImageKit(req.files.left[0]),
            right: await uploadToImageKit(req.files.right[0])
        }

        booking.postInspectionImages = postImages

        // Call TrustShield
        console.log("Calling TrustShield...")

        const response = await fetch(
            "https://ridecircle-trustshield.onrender.com/analyze",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    before_front: booking.preInspectionImages.front,
                    before_rear: booking.preInspectionImages.rear,
                    before_left: booking.preInspectionImages.left,
                    before_right: booking.preInspectionImages.right,
                    after_front: postImages.front,
                    after_rear: postImages.rear,
                    after_left: postImages.left,
                    after_right: postImages.right
                })
            }
        )

        console.log("TrustShield responded")

        const text = await response.text()
        console.log("RAW RESPONSE:", text)

        let result
        try {
            result = JSON.parse(text)
        } catch (err) {
            console.log("Invalid JSON from TrustShield")
            return res.json({ success: false, message: "TrustShield returned invalid response" })
        }

        if(result.success){
            booking.inspection = {
                overall_status: result.overall_status,
                overall_damage_ratio: result.overall_damage_ratio,
                overall_severity_score: result.overall_severity_score,
                side_results: result.sides
            }
        }

        booking.status = "completed"

        await booking.save()

        res.json({
            success: true,
            message: "Ride Completed",
            inspection: result
        })

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// Existing change status (untouched)
export const changeBookingStatus = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        booking.status = status;
        await booking.save();

        res.json({ success: true, message: "Status Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}