import passport from "passport"
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20"

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  BACKEND_URL,
} = process.env

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !BACKEND_URL) {
  throw new Error("Google OAuth environment variables are missing")
}

interface GoogleUser {
  googleId: string
  name: string
  email: string
  picture: string
}

declare global {
  namespace Express {
    interface User extends GoogleUser {}
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/user/auth/google/callback`,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ): Promise<void> => {
      try {
        const user: GoogleUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value || "",
          picture: profile.photos?.[0]?.value || "",
        }

        done(null, user)
      } catch (error) {
        done(error as Error, undefined)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((obj, done) => {
  done(null, obj as Express.User)
})