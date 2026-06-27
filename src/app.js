import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use( // CORS : cross origin resource sharing = Securiy mechanism enforced by browser
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials:true
    })
)



//common middleware
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public")) // Makes files inside the public folder accesible directly 
app.use(cookieParser())
// Server defines what to store in cookie and the browser actually stores it 
// cookies are small pieces of data 


// import routes 
import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import { errorHandler } from "./middlewares/error.middlewares.js"


//routes 

app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter) // if the request come from /api/v1/users route then direct to userRouter


app.use(errorHandler)

export {app}