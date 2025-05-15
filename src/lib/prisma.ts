import { PrismaClient } from "@prisma/client"
import { NODE_ENV } from "../config"

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

// Create a singleton instance of Prisma Client
let prisma: PrismaClient

if (NODE_ENV === "production") {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma
