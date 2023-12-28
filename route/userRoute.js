const express = require('express')
const user_route = express.Router()
const Auth = require("../middleware/auth")
const userController = require('../controllers/usercontroller')
const wishlistItems=require('../controllers/wishlist')

const { isLogedout, isLogged } = require('../middleware/auth')

 
user_route.get('/signup', isLogedout, userController.loadRegister)
user_route.post('/signup', userController.insertUser)


user_route.get('/showOtp/:userID/:otp', isLogedout, userController.showOtp);
user_route.post('/resendOtp',isLogedout,userController.resendOtp)
user_route.post('/verify-otp', isLogedout, userController.verifyOtp)
 
user_route.get('/login', isLogedout, userController.loadlogin)

user_route.post('/login', isLogedout, userController.userValid)

user_route.get('/forgotpassword', isLogedout, userController.loadforgetpassword)
user_route.post('/forgotpassword', isLogedout, userController.forgotpassword);
user_route.get('/resetpassword/:email', isLogedout, userController.loadresetpassword);
user_route.post('/resetpassword/:email', isLogedout, userController.resetpassword);

user_route.get('/',Auth.checkinguseroradmin)

user_route.post('/logout',Auth.logouting)

user_route.get('/home',userController.loadHome)

user_route.get('/shop',userController.loadshop)
user_route.get('/sortProducts/:option',userController.sortProduct)
user_route.get('/search',userController.searchProducts)
user_route.get('/shopdetails',  userController.shopdetails);
user_route.get('/categoryselection/:categoryName', userController.categorySelection);

user_route.get('/contact',userController.loadcontact)

user_route.get('/blog',userController.loadblog)

user_route.get('/services',userController.loadservices)

user_route.get('/cart',Auth.isLogged,userController.shoppingPage);
user_route.post('/cart/:productId',Auth.isLogged,userController.shoppingcart);
user_route.post('/cartupdation', Auth.isLogged,userController.updateCart);
user_route.delete('/deleteCart/:itemId',Auth.isLogged,userController.deleteCart)
user_route.get('/checkout',Auth.isLogged,userController.loadcheckout)
user_route.post('/checkout',Auth.isLogged,userController.checkout)

user_route.get('/userinfo',Auth.isLogged,userController.loaduserinfo)
user_route.get('/edituserinfo',Auth.isLogged,userController.loadedituserinfo)
user_route.post('/edituserinfo',Auth.isLogged,userController.edituserinfo)
user_route.get('/changepassword',Auth.isLogged,userController.loadchangepassword)
user_route.post('/changepassword',Auth.isLogged,userController.changePassword)
user_route.get('/editaddress',Auth.isLogged,userController.loadeditaddress)
user_route.post('/editaddress', Auth.isLogged, userController.editaddress);
user_route.get('/deleteAddress', Auth.isLogged, userController.deleteAddress);
user_route.get('/updateAddress/:id', Auth.isLogged, userController.loadupdateAddress);
user_route.post('/updateAddress/:id', Auth.isLogged, userController.updateAddress);
user_route.get('/myorders', Auth.isLogged, userController.loadmyorders);
user_route.get('/orderdetails/:orderId', Auth.isLogged, userController.loadorderdetails);
user_route.post('/createOrder', Auth.isLogged, userController.myorders);
user_route.get('/download-invoice/:orderId', Auth.isLogged, userController.downloadInvoice);
user_route.get('/thankyou', Auth.isLogged, userController.loadthankyou);
user_route.post('/cancel-order/:orderId', Auth.isLogged, userController.cancelOrder);
user_route.post('/returnOrder/:orderId', Auth.isLogged, userController.returnOrder);
user_route.post('/razorpayorder', Auth.isLogged,userController.createOrder)
user_route.post('/razorpaywallet', Auth.isLogged,userController.addToWallet)
user_route.post('/razorpaycallback', Auth.isLogged,userController.successWallet)
user_route.post('/walletorder', Auth.isLogged,userController.walletOrder)
user_route.post('/getTotalAmount',userController.totalAmount)
user_route.post('/coupon', Auth.isLogged, userController.applyCoupon);
user_route.post('/deletecoupon', Auth.isLogged, userController.deleteCoupon);


user_route.get('/wishlist', Auth.isLogged, wishlistItems.loadwishlist);
user_route.post('/wishlist/:productId', Auth.isLogged, wishlistItems.addwishlist);
user_route.delete('/wishlist/:itemId/remove',Auth.isLogged, wishlistItems.removeFromWishlist);

user_route.get('/wallet', Auth.isLogged, userController.loadWallet);


user_route.get('/categoryselection/:categoryId',Auth.isLogged,userController.categorySelection)



module.exports = user_route