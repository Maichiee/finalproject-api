import dotenv from "dotenv"
import App from "./app"
import prisma from "./lib/prisma"

// Load environment variables
dotenv.config()

// Create and start the application
const app = new App()
app.start()

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...")

  // Close Prisma connection
  await prisma.$disconnect()

  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("Shutting down server...")

  // Close Prisma connection
  await prisma.$disconnect()

  process.exit(0)
})
