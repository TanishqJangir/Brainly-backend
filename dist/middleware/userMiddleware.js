import jwt from "jsonwebtoken";
import { JWT_USER_SECRET } from "../config.js";
export const userMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    if (!header) {
        return res.status(411).json({
            message: "Authorization header is missing."
        });
    }
    const decode = jwt.verify(header, JWT_USER_SECRET); // yaha par ye as {id : string} kyu kiya ye samajh me nhi aaya, i mean is line me hi kyu kiya
    if (decode) {
        //@ts-ignore
        req.userId = decode.id; // userId likhne par typescript error de rha tha, to apann ne ek nya directory bana types naam se or usme ek file (express.d.ts) me kuch code lika or vo code bhi samajh me nhi aaya lekin ye error dur ho gya
        next();
    }
    else {
        return res.status(411).json({
            message: "You are not logged in"
        });
    }
};
//# sourceMappingURL=userMiddleware.js.map