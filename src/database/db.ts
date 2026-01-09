import mongoose, { model, Schema } from "mongoose";
import "dotenv/config";


const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  throw new Error("DB_URL is not defined in environment variables");
}

mongoose.connect(dbUrl);


const userSchema = new Schema({
    username : {type: String, required : true, unique: true},
    password : {type : String, required : true}
})



const contentTypes = ['youtube', 'x', 'document']; //You can extend as per your need

const contentSchema = new Schema({
    title : {type: String, required: true},
    link : {type : String, unique: true, required: true},
    body : String,
    type : {type : String, enum: contentTypes, required: true},
    tags : [{type : mongoose.Types.ObjectId, ref : "Tags"}],
    userId : {
        type : mongoose.Types.ObjectId, 
        ref : "Users", 
        required : true,
    },
    shareToken : {type : String, unique : true, sparse: true},
    shareExpiresAt : {type : Date}
})


const tagSchema = new Schema({
    title : {type : String, required: true}
})




export const UserModel = model("Users", userSchema);
export const ContentModel = model("Contents", contentSchema);
export const TagModel = model("Tags",tagSchema);