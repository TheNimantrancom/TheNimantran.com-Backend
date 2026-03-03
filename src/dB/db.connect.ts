import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config({
  path: "../../.env",
})

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string | undefined = process.env.MONGODB_URL

    if (!mongoURI) {
      throw new Error("MONGODB_URL is not defined in environment variables")
    }

    const connection = await mongoose.connect(mongoURI)

    console.log(
      "Database connected successfully:",
      connection.connection.host
    )
  } catch (error: unknown) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

export { connectDB }