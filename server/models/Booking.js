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
        enum: ["pending", "approved", "active", "completed", "cancelled"],
        default: "pending"
    },

    price: { type: Number, required: true },

    // 🚀 TrustShield Fields (Not used yet — future ready)
    preImage: { type: String },
    postImage: { type: String },

    inspection: {
        status: { type: String },
        severity_score: { type: Number },
        damage_ratio: { type: Number },
        ssim_score: { type: Number }
    }

}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
