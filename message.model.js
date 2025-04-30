import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId:{type:String,required:true},
    receiverId:{type:String,required:true},
    message:{type:String,required:true},
    time:{type:Date,default:Date.now},
    isRead:{type:Boolean,default:false},
},{timestamps:true})

const Message = mongoose.models.Message || mongoose.model('Message',messageSchema)


export default Message