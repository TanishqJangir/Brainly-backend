
import dotenv from "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import { UserModel, ContentModel } from "../database/db.js";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { userMiddleware } from "../middleware/userMiddleware.js";
import crypto from "crypto";
import cors from "cors";


const app = express();
app.use(cors());

app.use(express.json());


const JWT_USER_SECRET = process.env.JWT_USER_SECRET;

if (!JWT_USER_SECRET) {
    throw new Error("JWT_USER_SECRET is not defined in environment variables");
}


app.post("/api/v1/signup", async (req, res) => {


    const signupRequiredBody = z.object({
        username: z.string().max(50).min(3),
        password: z.string().max(50).min(8).
            regex(/[a-z]/, "Password must contain at least one lowercase letter").
            regex(/[A-Z]/, "Password must contain at least one uppercase letter").
            regex(/[0-9]/, "Password must contain at least one number").
            regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    })

    const parsedDataSuccess = signupRequiredBody.safeParse(req.body);

    if (!parsedDataSuccess.success) {
        res.status(411).json({
            message: "Incorrect Formate",
            error: parsedDataSuccess.error
        });
        return;
    };

    const { username, password } = parsedDataSuccess.data;

    if (!username || !password) {
        return res.status(411).json({
            message: "Username and password are required"
        })
    }

    try {

        const existingUser = await UserModel.findOne({ username });

        if (existingUser) {
            return res.status(403).json({
                message: "User already exist"
            })
        }

        const hashedPassword = await hash(password, 5);

        await UserModel.create({
            username: username,
            password: hashedPassword
        })

        res.status(200).json({
            msge: "You are signed up successfully."
        })

    } catch (error) {
        return res.status(500).json({
            message: "Some signup error occured.",
            error: error
        })
    }


});








app.post("/api/v1/signin", async (req, res) => {
    const signinRequiredBody = z.object({
        username: z.string().min(4).max(30),
        password: z.string().min(4).max(30),
    });

    const parsedDataSuccess = signinRequiredBody.safeParse(req.body);

    if (!parsedDataSuccess.success) {
        return res.status(400).json({
            message: "Incorrect format",
            error: parsedDataSuccess.error,
        });
    }

    const { username, password } = parsedDataSuccess.data;

    try {
        const existingUser = await UserModel.findOne({ username });

        if (!existingUser) {
            return res.status(403).json({
                message: "Invalid Username or Password",
            });
        }

        const passwordMatch = await compare(password, existingUser.password!);

        if (!passwordMatch) {
            return res.status(403).json({
                message: "Invalid Username or Password",
            });
        }

        const token = jwt.sign(
            { id: existingUser._id.toString() },
            JWT_USER_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            msge: "You are signed in successfully.",
            token,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Some signin error occurred.",
            error: error
        });
    }
});








app.post("/api/v1/content", userMiddleware, async (req, res) => {

    const contentRequiredBody = z.object({
        title: z.string().min(5).max(20),
        link: z.string(),
        body: z.string()
    })

    const parsedDataSuccess = contentRequiredBody.safeParse(req.body);

    if (!parsedDataSuccess.success) {
        return res.status(411).json({
            message: "Invalid input formate",
            error: parsedDataSuccess.error
        })
    }

    const { title, link, body} = parsedDataSuccess.data;

    try {
        const existingContent = await ContentModel.findOne({
            link: link
        });

        if (existingContent) {
            return res.status(403).json({
                message: "This link already exist."
            })
        }

        await ContentModel.create({
            title: title,
            link: link,
            body: body,
            //@ts-ignore
            userId: req.userId,
            tags: []
        })

        return res.status(200).json({
            message: "Content added successfully"
        })



    }
    catch (error) {
        res.status(500).json({
            message: "Some error occured in the content section.",
            error: error
        })
    }



})








app.get("/api/v1/content", userMiddleware, async (req, res) => {

    //@ts-ignore
    const userId = req.userId;

    if (!userId) {
        return res.status(400).json({
            message: "U are not signed in"
        })
    }

    try {

        const content = await ContentModel.find({
            userId: userId
        }).populate("userId", "username")

        return res.status(200).json({
            content
        })
    }
    catch (error) {
        return res.status(500).json({
            message: "Some error occured in the fetching the content of the user.",
            error: error
        });
    }
})



//Incomplete -> update wala syntax samajh me nhi aaya

// app.put("/api/v1/content/:contentId", userMiddleware, async (req, res) => {

//     const contentId = req.params.contentId;

//     const content = await ContentModel.findOne({
//         contentId: contentId
//     });

//     if (!contentId) {
//         return res.status(400).json({
//             message: "Content not found"
//         })
//     }

// })















// To delete a content of the usera
app.delete("/api/v1/content/:contentId", userMiddleware, async (req, res) => {
    const contentId = req.params.contentId;
    //@ts-ignore
    const userId = req.userId;

    if (!userId) {
        return res.status(400).json({
            message: "You are not authorized"
        })
    }

    try {

        const content = await ContentModel.findById(contentId);

        if (!content) {
            return res.status(400).json({
                message: "Content not found"
            })
        }

        if (content.userId.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this content."
            })
        }

        await ContentModel.findByIdAndDelete(contentId);

        return res.status(200).json({
            message: "Content deleted successfully."
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some error occured while deleting the content.",
            error: error
        })
    }

})











app.post("/api/v1/:contentId/share", userMiddleware, async (req, res) => {
    const contentId = req.params.contentId;

    //@ts-ignore
    const userId = req.userId

    if (!userId) {
        return res.status(400).json({
            message: "You are not authorized."
        })
    }

    try {
        const content = await ContentModel.findById(contentId);

        if (!content) {
            return res.status(401).json({
                message: "Content not found"
            })
        }

        if (content.userId.toString() !== userId) {
            return res.status(401).json({
                message: "You cannot share this content."
            })
        }

        const now = new Date();

        if (
            content.shareToken &&
            content.shareExpiresAt &&
            content.shareExpiresAt > now
        ) {
            return res.status(200).json({
                message: 'Share link already exist',
                shareToken : content.shareToken,
                sharelink: `http://www.secondBrain/share/${content.shareToken}`,
                expiresAt: `the link will be expired at : ${content.shareExpiresAt}`
            })
        }

        const shareToken = crypto.randomBytes(24).toString("hex");
        content.shareToken = shareToken;

        const shareExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        content.shareExpiresAt = shareExpiresAt;

        await content.save();

        return res.status(200).json({
            message: "Share link generated",
            shareToken : content.shareToken,
            shareLink: `http://www.secondBrain/share/${shareToken}`,
            shareExpiresAt : content.shareExpiresAt
        })

    }
    catch (error) {
        return res.status(500).json({
            message: "Some error occured while generating the link.",
            error: error
        })
    }

})






app.get("/api/v1/share/:shareToken", async (req, res) => {

    const { shareToken } = req.params;

    if (!shareToken) {
        return res.status(404).json({
            message: "Share link is invalid or expired"
        })
    }

    try {
        const content = await ContentModel.findOne({
            shareToken: shareToken,
            shareExpiresAt: { $gt: new Date() },
        }).populate("userId", "username");


        if (!content) {
            return res.status(400).json({
                message: "Share link is invalid or expired."
            })
        }

        return res.status(200).json({
            title: content.title,
            link: content.link,
            body: content.body,
            userId: content.userId
        })
    }

    catch (error) {
        return res.status(500).json({
            message: "Some error occured while getting the share link.",
            error: error
        })
    }
})







app.listen(3000, () => console.log("Started"));

