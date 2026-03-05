import app from "./app.js";
import { connectDB } from "./dB/db.connect.js";
import path from "path";
import { fileURLToPath } from "url";
const PORT = Number(process.env.PORT) || 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`HTTPS Server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to connect to DB:", error);
        process.exit(1);
    }
};
startServer();
