const {User} = require('../models/userModel');
const Wishlist =require('../models/wishlistModel')
const {Product}=require('../models/productModel')

const loadwishlist=async(req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            return res.redirect('/login')
        }
        const wishlistitem = await Wishlist.find({UserId:userId}).populate('ProductId')
        console.log("SD",wishlistitem);
        res.render('user/wishlist', {  error: null,wishlistitem })
    } catch (error) {
        res.render('user/wishlist', { error: 'Somthing went wrong', user: null })
    }
}
const addwishlist = async (req, res) => {
    try {
        const { productId, userId, productName, productImage, productPrice,offerPrice } = req.body;
        console.log('Request Body:', req.body);

        const existingItem = await Wishlist.findOne({ ProductId: productId, UserId: userId });

        if (existingItem) {
            return res.json({ message: 'Product is already in the wishlist.' });
        }

        const newItems = new Wishlist({
            ProductId: productId,
            UserId: userId,
            ProductName: productName,
            ProductImage: productImage,
            ProductPrice: productPrice,
            offerPrice:offerPrice
        });

        await newItems.save();

        console.log('Product ID:', productId);
        console.log('User ID:', userId);
        console.log('Product Name:', productName);
        console.log('Product Image:', productImage);
        console.log('Product Price:', productPrice);
        console.log('Offer Price:', offerPrice);

        res.json({ message: 'Product added to the wishlist successfully.' });

    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

const removeFromWishlist = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const deletedItem = await Wishlist.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).json({ error: 'Item not found in the wishlist' });
        }
        res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
};

module.exports = {
    loadwishlist,
    addwishlist,
    removeFromWishlist
}