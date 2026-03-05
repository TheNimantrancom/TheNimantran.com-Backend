import passport from "passport";
import { Strategy as GoogleStrategy, } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL, } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !BACKEND_URL) {
    throw new Error("Google OAuth environment variables are missing");
}
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/user/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value || "";
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName,
                email,
                isVerified: true,
            });
        }
        done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});
