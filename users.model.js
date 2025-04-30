import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        requred:true
    },
    phoneNumber:{
        type:Number,
        requred:true
    },
    password:{
        type:String,
        requred:true
    },
    location:{
        type:String,   
    },
    token:{
        type:String
    },
    email:{
        type:String
    },
    image:{
        type:String
    },
    message:{
        type:Array,
        default:[]
    }
})

const User = mongoose.models.User ||mongoose.model('User',userSchema)


export default User