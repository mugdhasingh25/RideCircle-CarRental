import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import User from "../models/User.js"

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value })

        if (user) {
            // User exists, just return them
            return done(null, user)
        }

        // Create new user from Google profile
        user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "google_oauth_" + profile.id, // placeholder password
            image: profile.photos[0].value
        })

        return done(null, user)

    } catch (error) {
        return done(error, null)
    }
}))

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (error) {
        done(error, null)
    }
})

export default passport