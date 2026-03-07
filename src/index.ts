import app from "./app.js"
import { connectDB } from "./dB/db.connect.js"

import path from "path"
import { fileURLToPath } from "url"

const PORT: number = Number(process.env.PORT) || 1000

const __filename: string = fileURLToPath(import.meta.url)
const __dirname: string = path.dirname(__filename)

const startServer = async (): Promise<void> => {
  try {
    await connectDB()
    
    app.listen(PORT, (): void => {
      console.log(`HTTPS Server running on http://localhost:${PORT}`)
    })
  } catch (error: unknown) {
    console.error("Failed to connect to DB:", error)
    process.exit(1)
  }
}

startServer()