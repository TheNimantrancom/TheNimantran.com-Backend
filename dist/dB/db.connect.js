import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({
    path: "../../.env",
});
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URL;
        if (!mongoURI) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        const connection = await mongoose.connect(mongoURI);
        console.log("Database connected successfully:", connection.connection.host);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
export { connectDB };
