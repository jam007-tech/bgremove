import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { createContext, useState, useEffect } from "react";
import axios from "axios";
import {toast} from "react-toastify"
import { useNavigate } from "react-router-dom";

export const context=createContext()

const contextProvider=(props)=>{

    const [credit,setCredit]=useState(0)
    const [image,setImage]=useState(false)
    const [resultImage,setResultImage]=useState(false)
    const [triggerUpload,setTriggerUpload]=useState(false) // 👈 add kiya
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const navigate=useNavigate()

    const {getToken}=useAuth()
    const { isSignedIn, user, isLoaded } = useUser();
    const {openSignIn}=useClerk()

    const loadCreditsData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/user/credits`,
                { clerkId: user.id },
                { headers: { token } }
            );
            if (data.success) {
                setCredit(data.credits)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (!isLoaded) return;
        if (isSignedIn) {
            loadCreditsData()
        } else {
            setCredit(0)
        }
    }, [isSignedIn, isLoaded])

    const removeBg=async(image)=>{
        try {
            if(!isSignedIn){
                return openSignIn()
            }
            setImage(image)
            setResultImage(false)
            navigate('/result')

            const token=await getToken()
            const formData = new FormData();
            formData.append("image", image);
            formData.append("clerkId", user.id);
            const {data}=await axios.post(backendUrl+'/api/image/remove-bg',formData,{
                headers:{token}
            })

            if(data.success){
                setResultImage(data.resultImage)
                data.creditBalance && setCredit(data.creditBalance)
            } else {
                toast.error(data.message)
                data.creditBalance && setCredit(data.creditBalance)
                if(data.creditBalance==0){
                    navigate('/buycredit')
                }
            }

        } catch (error) {
            console.log(error);
            toast.error(error.message)  
        }
    }

    const value={
        credit,
        setCredit,
        loadCreditsData,
        backendUrl,
        image,
        setImage,
        removeBg,
        resultImage,
        setResultImage,
        navigate,
        triggerUpload,      // 👈 add kiya
        setTriggerUpload    // 👈 add kiya
    }

    return (
        <context.Provider value={value}>
            {props.children}
        </context.Provider>
    )
}

export default contextProvider;