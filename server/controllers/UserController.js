import {Webhook} from "svix";
import userModel from "../models/userModel.js";

const clerkWebhooks=async (req, res) => {
    try {
        // create Svix instance with your secret
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        const {data,type}=req.body

        switch(type){
            case "user.created":{
                const userData={
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    photo: data.profile_image_url,
                    firstName: data.first_name,
                    lastName: data.last_name,
                }

                await userModel.create(userData)
                res.json({success: true, message: "User created successfully"})
                break
            }
            case "user.updated":{
                 const userData={
                    email: data.email_addresses[0].email_address,
                    photo: data.profile_image_url,
                    firstName: data.first_name,
                    lastName: data.last_name,
                }
                await userModel.findOneAndUpdate({clerkId: data.id}, userData,)
                res.json({success: true, message: "User updated successfully"})
                break
            }
            case "user.deleted":{
                await userModel.findOneAndDelete({clerkId: data.id})
                res.json({success: true, message: "User deleted successfully"}) 
                break
            }
        }
        
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

export {clerkWebhooks}