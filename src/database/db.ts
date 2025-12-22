import mongoose, { model, Schema } from "mongoose";


mongoose.connect("mongodb+srv://GGS:Tanishq%40123@cluster0.pkq0jts.mongodb.net/Second-Brain")


const userSchema = new Schema({
    username : {type: String, required : true, unique: true},
    password : {type : String, required : true}
})



const contentTypes = ['image', 'video', 'article', 'audio']; //You can extend as per your need

const contentSchema = new Schema({
    title : String,
    link : {type : String, unique: true, required: true},
    body : String,
    // type : {type : String, enum: contentTypes, required: true},
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