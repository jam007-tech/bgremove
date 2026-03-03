import multer from "multer"

const storage =multer.diskStorage({
    filename:function(req,file,callback){
        callback(null,`${Date.now()}_${file.originalname}`)
    }
})

const uplaod=multer({storage})

export default uplaod