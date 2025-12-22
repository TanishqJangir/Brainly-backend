import type { Request, Response,     NextFunction } from "express";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();


const JWT_USER_SECRET = process.env.JWT_USER_SECRET;

if (!JWT_USER_SECRET) {
    throw new Error("JWT_USER_SECRET is not defined in environment variables");
}


export const userMiddleware = (req: Request , res: Response , next : NextFunction) => {

    const header = req.headers["authorization"];

    if(!header){
        return res.status(411).json({
            message : "Authorization header is missing."
        })
    }

    const decode = jwt.verify(header as string, JWT_USER_SECRET) as {id : string};  // yaha par ye as {id : string} kyu kiya ye samajh me nhi aaya, i mean is line me hi kyu kiya

    if(decode){
        //@ts-ignore
        req.userId = decode.id; // userId likhne par typescript error de rha tha, to apann ne ek nya directory bana types naam se or usme ek file (express.d.ts) me kuch code lika or vo code bhi samajh me nhi aaya lekin ye error dur ho gya
        next();
    } else{
        return res.status(411).json({
            message : "You are not logged in"
        })
    }
}

