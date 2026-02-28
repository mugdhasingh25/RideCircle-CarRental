import express from "express";
import { 
  changeBookingStatus,
  checkAvailabilityOfCar,
  createBooking,
  getOwnerBookings,
  getUserBookings,
  startRide,
  endRide
} from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/multer.js";   // ✅ added

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkAvailabilityOfCar)
bookingRouter.post('/create', protect, createBooking)
bookingRouter.get('/user', protect, getUserBookings)
bookingRouter.get('/owner', protect, getOwnerBookings)

bookingRouter.post('/change-status', protect, changeBookingStatus)

// 🚀 UPDATED ROUTES WITH FILE UPLOAD
bookingRouter.post(
  '/start-ride',
  protect,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "rear", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 }
  ]),
  startRide
)

bookingRouter.post(
  '/end-ride',
  protect,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "rear", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 }
  ]),
  endRide
)

export default bookingRouter;