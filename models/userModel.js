const mongoose=require('mongoose')


const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    mobile:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    code:{
        type:String,
        require:true
    },

    is_admin:{
        type:Number,
        default:0
    },
    is_varified:{
        type:Number,
        default:0
    },
    is_blocked: {
        type: Boolean,
        default: false,
    },
    Address: [
        {
          name: { type: String, required: true },
          number: { type: String, required: true },
          house: { type: String, required: true },
          street: { type: String, required: true },
          city: { type: String, required: true },
          state: { type: String, required: true },
          country: { type: String, required: true },
          pincode: { type: String, required: true },
        },
      ],
      wallet: {
        type: Number,
        default: 0,
      },

      walletTransaction:[
        {
            date:{type:Date},
            type:{type:String},
            amount:{type:Number},
        },
      ],

})
const User= mongoose.model("User",UserSchema)
module.exports={
    User,
}
