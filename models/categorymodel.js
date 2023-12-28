const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    productImage: [{
        filename: String,
        data: Buffer,
        contentType: String
    }],
    discountPrice: {
        type: Number,
        required: true,
    },
});



module.exports = {
    Category:mongoose.model('Category',categorySchema)
}