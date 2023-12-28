const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
    },
    discountPrice: {
        type: Number,
        required: true,
    },
    minimumPrice: {
        type: Number,
        required: true,
    },
    couponApplicable: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'Category',
        
    },
    
    
    expiryDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});

module.exports = {
    Coupon: mongoose.model('Coupon', couponSchema),
};