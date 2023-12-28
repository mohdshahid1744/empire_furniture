const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    
},
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

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;