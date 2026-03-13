import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema({
    car: { type: ObjectId, ref: "Car", required: true },
    user: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },

    status: {
        type: String,
        enum: ["pending", "approved", "active", "returning", "completed", "cancelled","missed"],
        default: "pending"
    },

    price: { type: Number, required: true },

    // 🚀 TrustShield Fields Multi-view Fields
    preInspectionImages: {
        front: String,
        rear: String,
        left: String,
        right: String
    },
    postInspectionImages: {
        front: String,
        rear: String,
        left: String,
        right: String
    },

    inspection: {
        overall_status: String,
        overall_damage_ratio: Number,
        overall_severity_score: Number,
        side_results: mongoose.Schema.Types.Mixed
    }

}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
