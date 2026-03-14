import express from "express"
import passport from "../configs/passport.js"
import jwt from "jsonwebtoken"

const authRouter = express.Router()

// Initiate Google OAuth
authRouter.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}))

// Google OAuth callback
authRouter.get("/google/callback",
    passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login` }),
    async (req, res) => {
        try {
            const user = req.user

            // Generate JWT token same as normal login
            const token = jwt.sign(
                user._id.toString(),
                process.env.JWT_SECRET
            )

            // Redirect to frontend with token
            res.redirect(`${process.env.CLIENT_URL}/google-auth?token=${encodeURIComponent(token)}&name=${encodeURIComponent(user.name)}&image=${encodeURIComponent(user.image || "")}`)

        } catch (error) {
            res.redirect(`${process.env.CLIENT_URL}/login`)
        }
    }
)

export default authRouter