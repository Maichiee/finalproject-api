import express, { json, urlencoded, type Express, type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { PORT } from "./config"
import authRoutes from "./routers/auth.router"
import adminRoutes from "./routers/admin.router"

export default class App {
  private app: Express

  constructor() {
    this.app = express()
    this.configure()
    this.routes()
    this.handleError()
  }

  private configure(): void {
    this.app.use(cors())
    this.app.use(helmet())
    this.app.use(morgan("dev"))
    this.app.use(json())
    this.app.use(urlencoded({ extended: true }))
  }

  private handleError(): void {
    // Not Found Handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.includes("/api/")) {
        res
          .status(404)
          .send(
            "We are sorry, the endpoint you are trying to access could not be found on this server. Please ensure the URL is correct!",
          )
      } else {
        next()
      }
    })

    // Error Handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (req.path.includes("/api/")) {
        console.error("Error : ", err.stack)
        res.status(500).json({
          success: false,
          message: "Internal server error. Please try again later!",
        })
      } else {
        next()
      }
    })
  }

  private routes(): void {
    
    this.app.use("/", authRoutes)
    this.app.use("/", adminRoutes)
  }

  public start(): void {
    this.app.listen(PORT, () => {
      console.log(`  ➜ [API] Local:   http://localhost:${PORT}/`)
    })
  }
}
