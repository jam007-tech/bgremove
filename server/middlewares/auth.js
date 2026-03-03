import jwt from "jsonwebtoken";

const authUser = (req, res, next) => {
    try {

        const { token } = req.headers;

        if (!token) {
            return res.json({
                success: false,
                message: "Not Authorized User"
            });
        }

        const decoded = jwt.decode(token);

        req.clerkId = decoded.sub;

        next();

    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
};

export default authUser;