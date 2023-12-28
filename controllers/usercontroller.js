const {User} = require('../models/userModel');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer'); 
const { render } = require('ejs');
const session = require("express-session")
const crypto = require('crypto');
const {Category}=require('../models/categorymodel')
const {Product}=require('../models/productModel')
const {Order}=require('../models/orderModule')
const {Coupon}=require('../models/couponModel')
const Banner=require('../models/bannerModel')
const Cart=require('../models/cartModule')
const Wallet=require('../models/walletModel')
const Razorpay = require('razorpay');
const PDFDocument = require('pdfkit');
const short = require('short-uuid');
const uuid = short();
const dotenv = require('dotenv');
dotenv.config();
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});


const securepassword = async(password)=>{
    try{
      const passwordHash =   await bcrypt.hash(password,10)
      return passwordHash;
    }catch(error){
        console.log(error.message)
    }
}


const loadRegister = async(req,res)=>{
    try{
        res.render('user/signup')

    } catch(error){
        console.log(error.message);
    }
}

  
let nname
let eemail
let ppassword
let mobile
let ccode


const generateUUID = () => {
    return uuid.new();
};

const insertUser = async (req, res) => {
    try {
        const { name, email, password, mno,code } = req.body;
console.log("body",req.body);
const trimmedName = name.trim();
        if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
    return res.render('user/signup', { message: 'Name can only contain alphabetic characters and spaces.' });
}

if (name !== trimmedName) {
    return res.render('user/signup', { message: 'Name should not start or end with spaces.' });
}
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('user/signup', { message: 'Invalid email format.' });
        }

        if (password.length < 6) {
            return res.render('user/signup', { message: 'Password must be at least 6 characters long.' });
        }

        if(mno.length !== 10){
            return res.render('user/signup',{message:'mobile number is not valid'})
        }
        
        nname = name;
        eemail = email;
        mobile = mno;
        ppassword=password
        ccode = code;
        req.session.code=code;
        console.log("req",ccode);
       
        try {
            
            const spassword = await securepassword(password);

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.render('user/signup', { message: 'User with this email already exists.' });
            }

            const otp = generateOTP();
            const otpExpiration=Date.now() + 300000
            req.session.saveOtp=otp;
            req.session.otpExpiration=otpExpiration

            await sendOtpMail(email, otp);
            req.session.saveOtp = otp;
            console.log(otp);

            
            const newUser = new User({
                name: nname,
                email: eemail,
                password: spassword,
                mobile: mobile,
                 
            });

            // await newUser.save();

            res.redirect(`/showOtp/${eemail}/${otp}`);
        } catch (error) {
            console.log(error.message);
        }
    } catch (error) {
        console.log(error.message);
    }
};






const showOtp = async (req, res) => {
    try {
          res.render('user/otp');
    }catch (error) {}
};






function generateOTP() {
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}
let value=generateOTP()
console.log(value);

async function sendOtpMail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "Empirefurniture001@gmail.com",
                pass: "isbi trzw iyit wzvg", 
            },
        });

        const mailOptions = {
            from: "Empirefurniture001@gmail.com",
            to: email, 
            subject: "OTP Verification",
            text: `Your OTP for verification is: ${otp}`, 
        };

        await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully to", email);
    } catch (error) {
        console.log("Error sending OTP email:", error);
    }
}



const verifyOtp = async (req, res) => {
    const { digit1, digit2, digit3, digit4, digit5, digit6 } = req.body;

    const enteredOtp = `${digit1}${digit2}${digit3}${digit4}${digit5}${digit6}`;
    const savedOtp = req.session.saveOtp;
    const otpExpiration = req.session.otpExpiration;
    const password = ppassword;
    const userCode = generateUUID();
    const ccode = req.session.code;
    console.log("DS", ccode);

    if (otpExpiration && Date.now() <= otpExpiration) {
        if (enteredOtp === savedOtp) {
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                name: nname,
                email: eemail,
                password: hashedPassword,
                mobile: mobile,
                code: userCode,
            });

            try {
                const banners = await Banner.find({ isActive: true });
                if(ccode!=''){
                await newUser.save();
                newUser.wallet += 50;
                newUser.walletTransaction.push({
                    date: new Date(),
                    type: 'Signup Bonus',
                    amount: 100,
                });
            }
                await newUser.save();

                if (ccode) {
                    const referringUser = await User.findOne({ code: ccode });
                    if (!referringUser) {
                        return res.render('user/otp', { message: 'Invalid referral code.' });
                    }
                    console.log("DFS", referringUser);

                    if (referringUser && referringUser._id.toString() !== newUser._id.toString()) {
                       
                        referringUser.wallet += 100;
                        referringUser.walletTransaction.push({
                            date: new Date(),
                            type: 'Referral Bonus',
                            amount: 100,
                        });
                        await referringUser.save();
                    }
                }

                res.render('user/login', { banners });
            } catch (error) {
                console.log(error.message);
                res.render('user/otp', { message: 'Error saving user data.' });
            }
        } else {
            res.render('user/otp', { message: 'Invalid OTP, please try again.' });
        }
    } else {
        res.render('user/otp', { message: 'OTP has expired, please request a new one.' });
    }
};




const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const newOtp = generateOTP();
        await sendOtpMail(eemail, newOtp); 
        console.log(newOtp)
        req.session.saveOtp = newOtp;
        req.session.otpExpiration = Date.now() + 300000; 

        res.json({ message: 'New OTP sent successfully',otp:newOtp });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to generate and send OTP' });
    }
};









const loadlogin = async(req,res)=>{
    try{
        res.render('user/login')

    } catch(error){
        console.log(error.message);
    }
}


const userValid = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found in the database");
            return res.render('user/login', { message: "User not found" });
        }

        const storedPassword = user.password; 

        const is_blocked = user.is_blocked;

        if (is_blocked === true) {
            res.render('user/login',{message:'user is blocked'});
        } else {
            const isMatch = await bcrypt.compare(password, storedPassword); 

            if (!isMatch) {
                console.log("Wrong password");
                return res.render('user/login', { message: 'Wrong password' });
            }

            req.session.user = user._id;
            res.redirect('/home');
        }
    } catch (error) {
        console.log("Error in userValid:", error.message);
        res.render('user/login', { message: 'An error occurred during login' });
    }
};


const loadHome = async (req, res) => {
    try {
        const banners=await Banner.find({isActive: true})
        const userId=req.session.user
        const user = await User.findById(req.user)
        res.render('user/home', { user, error: null,banners,userId  })
    } catch (error) {
        res.render('user/home', { error: 'Somthing went wrong', user: null})
    }
}


const loadshop = async (req, res) => {
    try {
        const products = await Product.find({ isListed: true, productStock: { $gt: 0 } });
        const categories = await Category.find();
        const productImages = products.map(product => product.productImage.map(image => image.filename));
        const userId = req.session.user;
        res.render("user/shop", { products, productImages, categories, userId });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while loading the shop.");
    }
}
const shopdetails = async (req, res) => {
    let userId;
    if (req.session.user) {
        userId = req.session.user;
    }

    try {
        const products = await Product.find({ _id: req.query.id }).populate('productCategory');
        const category = await Category.findById(products.productCategory);
        console.log("SD", products);
        const productImages = products.map(product => product.productImage.map(image => image.filename)).flat();

        console.log(products, productImages);

        res.render("user/shopdetails", { products, productImages, userId, category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

  const categorySelection = async (req, res) => {
    try {
        const categoryName = req.params.categoryName;

        const category = await Category.findOne({ category: categoryName }).exec();

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const products = await Product.find({productCategory: category._id,isListed: true,productStock: { $gt: 0 }}).exec();

        const categoryDetails = {
            category: category,
            products: products,
            
        };

        return res.json(categoryDetails);
    } catch (err) {
        console.error('Error fetching category details:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
const loadforgetpassword = async (req, res) => {
    try {
        const user = await User.findById(req.user)
        res.render('user/forgetPassword', { user, error: null })
    } catch (error) {
        res.render('user/forgetPassword', { error: 'Somthing went wrong', user: null })
    }
}

const forgotpassword=async(req,res)=>{
    try{
    const {email}=req.body;
    const user=await User.findOne({email});
    if(!user){
        return res.render('user/forgetpassword',{message:"User with this email is not exist"})
    }

    const otp=generateOTP();
    const otpExpiration = Date.now() + 300000; 
    req.session.resetPasswordOtp = otp;
    req.session.resetPasswordOtpExpiration = otpExpiration;
    req.session.resetPasswordUserEmail = email;

    await sendOtpMail(email,otp)
    console.log(otp);
    res.redirect(`/resetpassword/${email}`);
    }catch(error){
        console.error("Error reseting password");
    }
}

const loadresetpassword = async (req, res) => {
    try {
        const user = await User.findById(req.user)
        const {email}=req.params
        res.render('user/resetpassword', { user, error: null,email})
    } catch (error) {
        res.render('user/resetpassword', { error: 'Somthing went wrong', user: null })
    }
}

const resetpassword = async (req, res) => {
    try {
    const { email } = req.params;
    const { otp, password } = req.body;
    const savedOtp = req.session.resetPasswordOtp;
    const otpExpiration = req.session.resetPasswordOtpExpiration;


    if (otpExpiration && Date.now() <= otpExpiration && otp === savedOtp) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.updateOne({ email }, { password: hashedPassword });
      req.session.resetPasswordOtp = null;
      req.session.resetPasswordOtpExpiration = null;
      req.session.resetPasswordUserEmail = null;

      res.render('user/login', { message: 'Password reset successfully' });
    } else {
      res.render('user/resetpassword', { email, message: 'Invalid OTP. Please try again.' });
    }
      } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).send('Internal Server Error');
     }
    };


const searchProducts = async (req, res) => {
    try {
        console.log('Full req.query object:', req.query);

        const query = req.query && req.query.query ? req.query.query : '';
        const trimmedQuery = query.trim();

        console.log('Search Query:', query);
        console.log('Trimmed Query:', trimmedQuery);

        const searchResults = await Product.find({ productName: { $regex: new RegExp(`${trimmedQuery}`, 'i') },productStock: { $gt: 0 } });
        const userId = req.session.user;
        


        console.log('Search Results:', searchResults);

        res.render('user/search', { searchResults, query: trimmedQuery,userId });
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const loadcontact = async (req, res) => {
    try {
        const userId=req.session.user
        const user = await User.findById(req.user)
        res.render('user/contact', { user, error: null,userId })
    } catch (error) {
        res.render('user/contact', { error: 'Somthing went wrong', user: null })
    }
}
const loadblog = async (req, res) => {
    try {
        const userId=req.session.user
        const user = await User.findById(req.user)
        res.render('user/blog', { user, error: null,userId })
    } catch (error) {
        res.render('user/blog', { error: 'Somthing went wrong', user: null })
    }
}
const loadservices = async (req, res) => {
    try {
        const userId=req.session.user
        const user = await User.findById(req.user)
        res.render('user/services', { user, error: null ,userId})
    } catch (error) {
        res.render('user/services', { error: 'Somthing went wrong', user: null })
    }
}



const shoppingPage = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.redirect('/login');
        }

        const cartItems = await Cart.find({ UserId: userId }).populate('ProductId');

        for (const item of cartItems) {
            const product = await Product.findById(item.ProductId);

            if (product.productStock === 0) {
                await Cart.findByIdAndRemove(item._id);
            } else if (item.Quantity > product.productStock) {
                item.Quantity = product.productStock;
                await item.save();
            }
        }
        let totalSum = 0;
        cartItems.forEach((item) => {
            totalSum += item.ProductId.offerPrice * item.Quantity;
        });

        let errorMessage = '';

        if (cartItems.length === 0) {
            errorMessage = 'Your cart is empty. Please add items before proceeding.';
        }

        res.render('user/cart', { cartItems, totalSum, errorMessage });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred while processing the request' });
    }
};

   const sortProduct = async (req, res) => {
    try {
        const options = req.params.option;
        let sortProduct;
        console.log('Sorting Option:', options);

        if (options === "lowToHigh") {
            sortProduct = await Product.find({isListed: true, productStock: { $gt: 0 }}).sort({ productPrice: 1 }).lean();
        } else if (options === "highToLow") {
            sortProduct = await Product.find({isListed: true, productStock: { $gt: 0 }}).sort({ productPrice: -1 }).lean();
        } else {
            return res.status(400).json({ error: 'Invalid sorting option' });
        }
        res.json(sortProduct);
    } catch (error) {
        console.error("Error while sorting");
        res.status(500).json({ error: 'Internal server error' });
    }
};



   const updateCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const count=req.body.count;
        const userId = req.session.user;
        const product = await Product.find({ _id: productId });
        console.log('UserId:', userId);
        console.log('ProductId:', productId);
console.log("req.body",req.body);
        const cartItem = await Cart.findOne({ UserId: userId, ProductId: productId });
        console.log('CartItem:', cartItem);

        if (!cartItem) {
            console.error('Cart item not found');
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        if (product.productStock === 0) {
            await Cart.findByIdAndRemove(cartItem._id);
            return res.status(200).json({ success: true, message: 'Product is out of stock and has been removed from the cart.' });
        }


        if (count > 0) {
            if (cartItem.Quantity < product[0].productStock) {
                cartItem.Quantity += 1;
            }
        } else {
            if (cartItem.Quantity > 1) {
                cartItem.Quantity -= 1;
            }
        }
        await cartItem.save();

        const cartItems = await Cart.find({ UserId: userId }).populate('ProductId');
        let totalSum = 0;
        cartItems.forEach((item) => {
            totalSum += item.ProductId.offerPrice * item.Quantity;
        });
        console.log(totalSum);
        res.json({ totalSum });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






const shoppingcart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.productId;
      if(userId){
        const existingCartItem = await Cart.findOne({ ProductId: productId, UserId: userId});

        if (existingCartItem) {
            res.json({ message: 'Product is already in the cart.' });
        } else {
            const newCart = new Cart({
                ProductId: productId,
                UserId: userId,
                
            });
            await newCart.save();
            res.json({ message: 'Product added to the cart successfully.' });
        }
    }else {
        res.redirect('/login');
        }
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
};


const deleteCart = async (req, res) => {
    const itemId = req.params.itemId;
    console.log('Item ID:', itemId);

    try {
        const deletedItem = await Cart.findByIdAndRemove(itemId);
        console.log('Deleted Item:', deletedItem);

        if (!deletedItem) {
            return res.status(404).json({ success: false, error: 'Item not found.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error removing item:', err);
        return res.status(500).json({ success: false, error: 'An error occurred while removing the item.' });
    }
};
const loadcheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const cartItems = await Cart.find({ UserId: userId }).populate('ProductId');
        const coupons = await Coupon.find({ isActive: true, expiryDate: { $gte: new Date() } }).populate('couponApplicable');
        const category=await Category.find({})
        
        if (cartItems.length === 0) {
            const address = user ? user.Address : null;
            return res.render('user/cart', {
                user,
                cartItems,
                totalSum: 0, 
                address,
                errorMessage: 'Your cart is empty. Please add items before proceeding to checkout.'
            });
        }
        for (const item of cartItems) {
            const product = await Product.findById(item.ProductId);
            if (!product) {
               console.log("Product not found");
                continue;
            }
            
            if (product.productStock <= 0 ) {
                await Cart.findByIdAndRemove(item._id);
              
            } else {
                item.Quantity = Math.min(product.productStock, item.Quantity);
                await item.save();
            }
           
        }

        let totalSum = 0;
        cartItems.forEach((item) => {
            totalSum += item.ProductId.offerPrice * item.Quantity;
        });
        req.session.address = user ? user.Address : null;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.Address;

        res.render('user/checkout', { user, cartItems, totalSum, address ,coupons,category});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

  
    
    
    const checkout = async (req, res) => {
        try {
            const { name, number, house,street, city, state,country, pincode } = req.body;
            const userId = req.session.user;
    
            const address = {
                name,
                number,
                house,
                street,
                city,
                state,
                country,
                pincode
                
            };
    
            const user = await User.findById(userId);
            const coupons = await Coupon.find({ isActive: true, expiryDate: { $gte: new Date() } }).populate('couponApplicable');
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            if (!user.Address) {
                user.Address = [];
            }
    
            const cartItems = await Cart.find({ UserId: userId }).populate('ProductId');
            user.Address.push(address);
    
            const updatedUser = await user.save();
    
            let totalSum = 0;
            cartItems.forEach((item) => {
                totalSum += item.ProductId.offerPrice * item.Quantity;
            });
    
            return res.render('user/checkout', { message: 'Address added successfully', address: updatedUser.Address, cartItems, totalSum ,coupons});
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    

    const loaduserinfo = async (req, res) => {
        try {
            const userId = req.session.user;
            const user = await User.findById(userId);
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            const address = user.Address;
    
            const wallet = await Wallet.findOne({ UserId: userId });

            console.log('Wallet Data:', wallet);
    
            res.render('user/userinfo', { userId: user, address, wallet });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    
    const loadedituserinfo = async (req, res) => {
        try {
            const userId = req.session.user;
            const user = await User.findById(userId);
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.render('user/edituserinfo', { userId: user, error: null })
        } catch (error) {
            res.render('user/edituserinfo', { error: 'Somthing went wrong', user: null })
        }
    }

    const edituserinfo = async (req, res) => {
        const { editUsername, editMobile } = req.body;
        console.log('Request Body:', req.body);
        const userId = req.session.user; 
    
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { name: editUsername, mobile: editMobile },
                { new: true } 
            );
    
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            res.redirect('/userinfo');
            
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).send('Internal Server Error');
        }
    };

    const loadchangepassword = async (req, res) => {
        try {
            const userId = req.session.user;
            const user = await User.findById(userId);
    
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.render('user/changepassword', { userId: user, error: null })
        } catch (error) {
            res.render('user/changepassword', { error: 'Somthing went wrong', user: null })
        }
    }

    const changePassword = async (req, res) => {
        try {
            const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
            if (newPassword !== confirmNewPassword) {
                return res.status(400).json({ message: 'New password and confirm password do not match' });
            }
            const user = await User.findById(req.session.user); 
    
            if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
                const errorMessage = 'Invalid current password';
                return res.render('user/changepassword', { userId: user, error: errorMessage });
            }
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
    
            res.render('user/userinfo', { userId: user, error: null });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    
    const loadeditaddress = async (req, res) => {
        try {
            const userId = req.session.user;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.render('user/editaddress', { userId: user, error: null })
        } catch (error) {
            res.render('user/editaddress', { error: 'Somthing went wrong', user: null })
        }
    }
    const editaddress = async (req, res) => {
        const { name, number, house,street, city, state, country, pincode } = req.body;
        const userId = req.session.user;
    
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        Address: {
                            name,
                            number,
                            house,
                            street,
                            city,
                            state,
                            country,
                            pincode,
                        },
                    },
                },
                { new: true }
            );
    
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
    
            res.redirect('/userinfo');
        } catch (error) {
            console.error('Error updating user address:', error);
            res.status(500).send('Internal Server Error');
        }
    };
    const deleteAddress = async (req, res) => {
        try {
            const id = req.query.id;

            const userId = req.session.user;
    
            const userData = await User.findByIdAndUpdate(
                { _id: userId },
                { $pull: { Address: { _id: id } } }
            );
            if (userData) {
                res.redirect('/userinfo');
            } else {
                res.status(404).json({ error: 'Address not found or not deleted.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while deleting the address' });
        }
    }
    
    const loadupdateAddress = async (req, res) => {
        try {
            const userId = req.session.user;
            const addressId = req.params.id;
            const user = await User.findById(userId);
    
            if (!user) {
                console.log('User not found condition');
                return res.status(404).send('User not found');
            }
    
            const address = user.Address.id(addressId);
    
            if (!address) {
                console.log('Address not found condition');
                return res.status(404).send('Address not found');
            }
    
            res.render('user/updateAddress', { address});
        } catch (error) {
            res.status(500).send(error.message);
        }
    };
    
        
        const updateAddress = async (req, res) => {
            try {
                const userId = req.session.user;
                const addressId = req.params.id;
                const { name, number, house, street, city, state, country, pincode } = req.body;

         
        
       const updatedUser = await User.findOneAndUpdate(
            { _id: userId, 'Address._id': addressId }, 
            {
                $set: {
                    'Address.$.name': name,
                    'Address.$.number': number,
                    'Address.$.house': house,
                    'Address.$.street': street,
                    'Address.$.city': city,
                    'Address.$.state': state,
                    'Address.$.country': country,
                    'Address.$.pincode': pincode,
                },
            },
            { new: true }
        );
        
                console.log("new add", updatedUser);
        
                res.redirect('/userinfo');
            } catch (error) {
                console.error('Error updating address:', error);
                res.status(500).send('Internal Server Error');
            }
        };
        

        const formatProductPrice = (product, cartItems) => {
            const originalPrice = product.productPrice
            const totalSum = calculateTotalAmount(cartItems);
            const offerPrice = product.offerPrice || originalPrice;
            return offerPrice;
        };

    const loadmyorders = async (req, res) => {
        const userId = req.session.user;
        try {
            const user = await User.findById(userId);
          const orders = await Order.find({ userId: userId }).lean();
          
          const discountApplied=req.session.discountedTotal > 0
          res.render('user/myorders', { orders , formatProductPrice, discountApplied});
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching orders');
        }
      };

      const loadorderdetails = async (req, res) => {
        try{
            const orderId = req.params.orderId;
            const order=await Order.findOne({_id: orderId })
            const categories=await Category.find({})
            res.render('user/orderdetails',{categories,order})
    
        }
        catch(err){
            console.log(err)
        }
    }


      const calculateTotalAmount = (cartItems) => {
        if (!cartItems || cartItems.length === 0) {
            return 0;
        }
        let totalSum = 0;
        cartItems.forEach((item) => {
            const originalPrice = item.ProductId.offerPrice;
            const offerPrice = item.ProductId.offerPrice || originalPrice;
    
            totalSum += offerPrice * item.Quantity;
        });
        return totalSum;
    };
    
    const myorders = async (req, res) => {
        try {
            const userId = req.session.user;
            const cartItems = await Cart.find({ UserId: userId }).populate('ProductId').lean();
            const selectedAddressId = req.body.selectedAddressId; 
            const user = await User.findById(userId);
    
            const selectedAddress = user.Address.find(address => address._id.toString() === selectedAddressId);
    
            if (!selectedAddress) {
                return res.status(400).send('Selected address not found.');
            }
    
            const products = cartItems.map((cartItem) => ({
                productId: cartItem.ProductId._id,
                productName: cartItem.ProductId.productName,
                productPrice: cartItem.ProductId.productPrice,
                quantity: cartItem.Quantity,
            }));
    
            const totalSum = calculateTotalAmount(cartItems);
            for (const cartItem of cartItems) {
                const product = await Product.findById(cartItem.ProductId);
                product.productStock -= cartItem.Quantity;
                await product.save();
            }
    
            let discountedTotal;
            if (req.session.discountedTotal && req.session.discountedTotal > 0) {
                discountedTotal = req.session.discountedTotal;
            } else {
                discountedTotal = totalSum;
            }
    
            const newOrderId = generateOrderId('USR');
            const newOrder = new Order({
                orderId: newOrderId,
                userId: userId,
                products: products,
                address: selectedAddress,
                total: discountedTotal,
                paymentMethod: req.body.paymentMethod,
            });
    
            await newOrder.save();
            await Cart.deleteMany({ UserId: userId });
            delete req.session.discountedTotal;
            if (discountedTotal < totalSum) {
                res.status(200).json({
                    message: 'Order placed successfully with coupon applied',
                    total: discountedTotal,
                });
            } else {
                res.status(200).json({
                    message: 'Order placed successfully without coupon',
                    total: totalSum,
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error placing the order');
        }
    };
    

    const walletOrder=async(req,res)=>{
        try{
            const userId = req.session.user;
            const cartItems = await Cart.find({ UserId: userId }).populate('ProductId').lean();
            const selectedAddressId = req.body.selectedAddressId; 
            const user = await User.findById(userId);
            const wallet = await Wallet.findOne({ UserId: userId });
          

         
    
            const selectedAddress = user.Address.find(address => address._id.toString() === selectedAddressId);
    
            if (!selectedAddress) {
                return res.status(400).send('Selected address not found.');
            }
    
            const products = cartItems.map((cartItem) => ({
                productId: cartItem.ProductId._id,
                productName: cartItem.ProductId.productName,
                productPrice: cartItem.ProductId.productPrice,
                quantity: cartItem.Quantity,
            }));
    
            const totalSum = calculateTotalAmount(cartItems);
            for (const cartItem of cartItems) {
                const product = await Product.findById(cartItem.ProductId);
                product.productStock -= cartItem.Quantity;
                await product.save();
            }
            let discountedTotal;
            if (req.session.discountedTotal && req.session.discountedTotal > 0) {
                discountedTotal = req.session.discountedTotal;
            } else {
                discountedTotal = totalSum;
            }
            if (wallet.wallet < discountedTotal) {
                return res.status(400).json({ error: 'Insufficient wallet balance' });
            }
            wallet.wallet -= discountedTotal;
            wallet.walletTransaction.push({
                date: new Date(),
                type: 'debit',
                amount: discountedTotal,
            });
            await wallet.save()

                const newOrderId = generateOrderId('USR');
                const newOrder = new Order({
                    orderId: newOrderId,
                    userId: userId,
                    products: products,
                    address: selectedAddress,
                    total: discountedTotal,
                    paymentMethod: 'Wallet',
                });
    
                await newOrder.save();
                await Cart.deleteMany({ UserId: userId });
                delete req.session.discountedTotal;
    
                return res.status(200).json({
                    message: 'Order placed successfully with wallet payment',
                    total: discountedTotal,
                    paymentMethod: 'Wallet Payment',
                });
            
        }catch(error){
            console.error(error);
            res.status(500).send('Error placing the order');
        }
    }

    function generateOrderId(prefix) {
        const timestamp = Date.now().toString(36);
        const randomString = Math.random().toString(36).substr(2, 5); 
        return `${prefix}-${timestamp}-${randomString}`;
    }

    
    
    const cancelOrder = async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findById(orderId);
    
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            if (order.cancelled) {
                return res.status(400).json({ success: false, message: 'Order is already canceled' });
            }
            const userId = req.session.user;
            const user = await User.findById(userId);
    
            const wallet = await Wallet.findOne({ UserId: userId });
    
            if (!wallet) {
                const newWallet = new Wallet({
                    UserId: userId,
                });
                await newWallet.save();
            }
    
            const updatedWallet = await Wallet.findOne({ UserId: userId });
    
            for (const product of order.products) {
                const productId = product.productId;
                const quantity = product.quantity;
                const productToUpdate = await Product.findById(productId);
    
                if (productToUpdate) {
                    productToUpdate.productStock += quantity;
                    await productToUpdate.save();
                }
            }
    
            order.cancelled = true;
            if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
                updatedWallet.walletTransaction.push({
                    date: new Date(),
                    type: 'credit',
                    amount: order.total,
                });
    
                updatedWallet.wallet += order.total;
                await updatedWallet.save();
            }
            await order.save();
    
            if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'Wallet') {
                const updatedWalletAmount = updatedWallet.wallet.toFixed(2);
                return res.status(200).json({
                    message: 'Amount credited to wallet',
                    walletAmount: updatedWalletAmount,
                    cancellationReason: order.cancellationReason,
                });
            } else {
                return res.status(200).json({
                    message: 'Order cancelled successfully',
                    cancellationReason: order.cancellationReason,
                });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
    

    const returnOrder = async (req, res) => {
        try {
            console.log('Starting returnOrder function...');
            const orderId = req.params.orderId;
            console.log('Order ID:', orderId);
            const order = await Order.findById(orderId);
            console.log("HELLLL",order);
            const userId=req.session.user;
            const wallet = await Wallet.findOne({ UserId: userId });
    
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            if (order.returned) {
                return res.status(400).json({ success: false, message: 'Order is already canceled' });
            }

            for (const product of order.products) {
                const productId = product.productId;
                const quantity = product.quantity;
                const productToUpdate = await Product.findById(productId);
                
    
                if (productToUpdate) {
                    productToUpdate.productStock += quantity;
                    await productToUpdate.save();
                }
            }
            const user = await User.findById(userId);
            console.log("ghv",user);
    
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            wallet.wallet += order.total;

            wallet.walletTransaction.push({
                date: new Date(),
                type: 'credit', 
                amount: order.total,
            });
            await Promise.all([wallet.save(), order.updateOne({ returned: true })]);
    
            res.json({ success: true, message: 'Order returned successfully', returnedOrder: order });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };

    const downloadInvoice = async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const order = await Order.findById(orderId).populate('products.productId').lean();
            const user = await User.findById(order.userId).lean();
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
            res.setHeader('Content-Type', 'application/pdf');
    
            const doc = new PDFDocument();
            doc.pipe(res);
            doc.fontSize(18).text(`Invoice for your order`, { align: 'center' }).moveDown(0.5);
            doc.fontSize(14).text(`Order Date: ${order.date.toLocaleDateString()}`, { align: 'left' }).moveDown(0.5);
            doc.fontSize(14).text(`Customer Name: ${user.name}`, { align: 'left' }).moveDown(0.5);
            doc.fontSize(16).text('Address:', { align: 'left' }).moveDown(0.5);
            doc.fontSize(12).text(`Name: ${order.address[0].name}`);
            doc.fontSize(12).text(`Number: ${order.address[0].number}`);
            doc.fontSize(12).text(`House: ${order.address[0].house}`);
            doc.fontSize(12).text(`Street: ${order.address[0].street}`);
            doc.fontSize(12).text(`City: ${order.address[0].city}`);
            doc.fontSize(12).text(`State: ${order.address[0].state}`);
            doc.fontSize(12).text(`Country: ${order.address[0].country}`);
            doc.fontSize(12).text(`Pincode: ${order.address[0].pincode}`);
           
            doc.moveDown(0.5);

            doc.fontSize(16).text('Product Details:', { align: 'left' }).moveDown(0.5);
            order.products.forEach((product) => {
                doc.fontSize(12).text(`Product Name: ${product.productId.productName}`);
                doc.fontSize(12).text(`Price: ${product.productId.productPrice.toFixed(2)}`);
                doc.fontSize(12).text(`Quantity: ${product.quantity}`);
                doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
                doc.fontSize(12).text(`Total: ${(order.total)}`);
                doc.moveDown(0.5);
            });
            doc.end();
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating or downloading the invoice');
        }
    };
    

    const createOrder = async (req, res) => {
        try {
            const selectedAddressId = req.body.selectedAddressId;
            const paymentMethod = req.body.paymentMethod;
            const couponCode = req.body.couponCode;
    
            if (!selectedAddressId || !paymentMethod) {
                throw new Error('Invalid data received for Razorpay payment');
            }
    
            const userId = req.session.user;
            const cartItems = await Cart.find({ UserId: userId }).populate('ProductId').lean();
            let totalAmount = calculateTotalAmount(cartItems);
    
            if (couponCode) {
                const coupon = await Coupon.findOne({ couponCode });
    
                if (coupon && coupon.isActive && new Date() <= coupon.expiryDate) {
                    const discountAmount = coupon.discountPrice;
    
                    if(totalAmount >= coupon.minimumPrice){
                    if (coupon.couponApplicable && coupon.couponApplicable !== '') {
                        const productCategory = coupon.couponApplicable;
    
                        const categoryItems = cartItems.filter(item => item.ProductId.productCategory.equals(productCategory));
                        const categoryTotal = calculateTotalAmount(categoryItems);
                        const discountedTotal = calculateDiscountedTotalSomehow(categoryTotal, coupon.discountPrice);
                        const otherItems = cartItems.filter(item => !item.ProductId.productCategory.equals(productCategory));
                        const otherItemsTotal = calculateTotalAmount(otherItems);
                        totalAmount = discountedTotal + otherItemsTotal;
                    } else {
                        totalAmount -= discountAmount * totalAmount / 100;
                    }
                }
            }
        }
    
            const roundedTotalAmount = Math.ceil(totalAmount * 100);

        const orderData = {
            amount: roundedTotalAmount,
            currency: 'INR',
            receipt: req.body.orderId,
            notes: {
                key1: 'value1',
                key2: 'value2',
            },
        };

        const razorpayOrder = await razorpayInstance.orders.create(orderData);
        res.json({ orderId: razorpayOrder.id, razorpayOrder, amount: totalAmount });
    } catch (error) {
        console.error('Error in createOrder function:', error);
        res.status(500).json({ error: `Error creating Razorpay order: ${error.message}` });
    }
};
    

   const addToWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const orderOptions = {
            amount: amount * 100,
            currency: 'INR',
            receipt: 'wallet_transaction',
        };

        const order = await razorpayInstance.orders.create(orderOptions);
        req.session.paymentData = {
            orderId: order.id,
            walletAmount: parseFloat(amount),
        };

        res.json({ orderId: order.id, amount: order.amount });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Error creating Razorpay order' });
    }
};

const successWallet = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        console.log("req", req.body);

        const generatedSignature = crypto.createHmac('sha256', RAZORPAY_SECRET_KEY)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            const sessionData = req.session.paymentData;

            if (sessionData) {
                const userId = req.session.user;
                const wallet = await Wallet.findOne({ UserId: userId });

                if (!wallet) {
                    console.error('Wallet not found for user:', userId);
                    return res.status(404).send('Wallet not found');
                }

                wallet.wallet += sessionData.walletAmount;
                const transaction = {
                    type: 'credit',
                    date: new Date(),
                    amount: sessionData.walletAmount,
                };

                wallet.walletTransaction.push(transaction);
                await wallet.save();

                res.status(200).send('Payment successful');
            } else {
                console.error('Payment data not found in the session');
                res.status(500).send('Payment data not found');
            }
        } else {
            console.error('Invalid Razorpay signature');
            res.status(400).send('Invalid Razorpay signature');
        }
    } catch (error) {
        console.error('Error processing Razorpay callback:', error);
        res.status(500).send('Error processing Razorpay callback');
    }
};


    const totalAmount = async (req, res) => {
        try {
            const selectedAddressId = req.body.selectedAddressId;
    
            const user = await User.findById(req.session.user);
            const selectedAddress = user.Address.find(address => address._id.toString() === selectedAddressId);
    
            if (!selectedAddress) {
                return res.status(400).json({ error: 'Selected address not found.' });
            }
    
            const cartItems = await Cart.find({ UserId: req.session.user }).populate('ProductId');
            let totalAmount = 0;
    
            for (const cartItem of cartItems) {
                totalAmount += cartItem.ProductId.productPrice * cartItem.Quantity;
            }
            res.json({ totalAmount });
        } catch (error) {
            console.error('Error in totalAmount function:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    

    const calculateDiscountedTotalSomehow = (totalSum, discountPrice) => {
        const discountedTotal = totalSum - (totalSum * (discountPrice / 100));
        return discountedTotal;
    };
    
    const applyCoupon = async (req, res) => {
        try {
            const { couponCode } = req.body;
            const coupon = await Coupon.findOne({ couponCode });
    
            if (coupon && coupon.isActive && new Date() <= coupon.expiryDate) {
                const userId = req.session.user;
                const cartItems = await Cart.find({ UserId: userId }).populate('ProductId').lean();
                const totalSum = calculateTotalAmount(cartItems);
    
                if (totalSum >= coupon.minimumPrice) {
                    let discountedTotal;
    
                    if (coupon.couponApplicable && coupon.couponApplicable !== '') {
                        const productCategory = coupon.couponApplicable;
                        console.log("Coupon Applicable Category:", productCategory);
    
                        const categoryItems = cartItems.filter(item => item.ProductId.productCategory.equals(productCategory));
                        console.log("Category Items:", categoryItems);
    
                        if (categoryItems.length > 0) {
                            const categoryTotal = calculateTotalAmount(categoryItems);
                            discountedTotal = calculateDiscountedTotalSomehow(categoryTotal, coupon.discountPrice);
                            const otherItems = cartItems.filter(item => !item.ProductId.productCategory.equals(productCategory));
                            const otherItemsTotal = calculateTotalAmount(otherItems);
                            discountedTotal += otherItemsTotal;
                        } else {
                            res.json({ valid: false, message: 'No products in the specified category for the coupon' });
                            return;
                        }
                    } else {
                        discountedTotal = calculateDiscountedTotalSomehow(totalSum, coupon.discountPrice);
                    }
                    discountedTotal = parseFloat(discountedTotal.toFixed(2));
                    req.session.discountedTotal = discountedTotal;
    
                    console.log('Discounted Total:', discountedTotal);
    
                    res.json({ valid: true, coupon, totalSum, discountedTotal });
                } else {
                    res.json({ valid: false, message: 'Order total does not meet the minimum price requirement' });
                }
            } else {
                res.json({ valid: false, message: 'Invalid coupon code' });
            }
    
        } catch (error) {
            console.error('Error applying coupon:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    
    
 
    const deleteCoupon=async(req,res)=>{
        try {
            if (req.session.discountedTotal) {
                delete req.session.discountedTotal;
                console.log("deletd");
                res.status(200).json({ message: 'Coupon cleared successfully on deleteCoupon' });
            } else {
                res.status(404).json({ message: 'No coupon found on deleteCoupon' });
            }
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).json({ error: 'Internal server error on deleteCoupon' });
        }
    }
    
    const loadthankyou = async (req, res) => {
        try {
            const user = await User.findById(req.user)
            res.render('user/thankyou', { user, error: null })
        } catch (error) {
            res.render('user/thankyou', { error: 'Somthing went wrong', user: null })
        }
    }
    const loadWallet = async (req, res) => {
        try {
            const userId = req.session.user;
            const wallet = await Wallet.findOne({ UserId: userId });
    
            if (!wallet) {
                return res.render('user/wallet', { error: 'Wallet not found', wallet: null });
            }
    
            res.render('user/wallet', { error: null, wallet });
        } catch (error) {
            console.error('Error:', error);
            res.render('user/wallet', { error: 'Something went wrong', wallet: null });
        }
    };
    

 
    
const logout = (req, res) => {
    req.session.destroy()
    res.redirect('/home')
}




module.exports = {
    loadRegister,
    insertUser,
    showOtp,
    verifyOtp,
    resendOtp,
    loadlogin,
    userValid,
    loadforgetpassword,
    forgotpassword,
    loadresetpassword,
    resetpassword,
    loadHome,
    loadcontact,
    loadblog,
    loadshop,
    shopdetails,
    searchProducts,
    shoppingPage,
    sortProduct,
    updateCart,
    shoppingcart,
    deleteCart,
    loadservices,
    loadcheckout,
    checkout,
    loaduserinfo,
    loadedituserinfo,
    edituserinfo,
    loadchangepassword,
    changePassword,
    loadeditaddress,
    editaddress,
    deleteAddress,
    loadupdateAddress,
    updateAddress,
    loadmyorders,
    loadorderdetails,
    myorders,
    walletOrder,
    cancelOrder,
    returnOrder,
    createOrder,
    addToWallet,
    successWallet,
    downloadInvoice,
    totalAmount,
    applyCoupon,
    deleteCoupon,
    loadthankyou,
    loadWallet,
    logout,
    categorySelection 
}
