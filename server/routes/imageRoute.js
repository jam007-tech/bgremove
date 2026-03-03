import express from "express"
import { removeBgImage } from "../controllers/ImageController.js"
import uplaod from "../middlewares/multer.js"
import authUser from "../middlewares/auth.js"

const imageRouter=express.Router()

imageRouter.post('/remove-bg',uplaod.single('image'),authUser,removeBgImage)

export default imageRouter