const { render } = require('ejs');
const {User} = require('../models/userModel');
const Users=require('../controllers/usercontroller')
const bcrypt = require('bcrypt')
const {Category} = require('../models/categorymodel');
const {Product}=require('../models/productModel')
const {Order}=require('../models/orderModule')
const {Coupon}=require('../models/couponModel')
const Banner=require('../models/bannerModel')
const PDFDocument = require('pdfkit');
const multer=require('multer')
const storage=multer.memoryStorage();
const upload=multer({storage})


const securepassword = async(password)=>{
    try{
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch(error){
        console.log(error.message);
    }
}
const loadAdmin = async(req,res)=>{
    try{
        res.render('admin/adminLogin')
    } catch(error){
        console.log(error.message);
    }
}


const adminValid = async(req,res)=>{
    const { email, password} = req.body;
  
    try{
        const admin = await User.findOne({email})
    
        if(!admin){
            return res.render('admin/adminLogin',{message:"admin not registerd"})
        }
        
        const isMatch = await bcrypt.compare(password,admin.password)
        if(!isMatch){
            return res.render('admin/adminLogin',{ message:"password is incorrect" })
        }
        if(admin.is_admin === 1){
            req.session.admin = admin._id
            res.redirect('/admin/dashboad');
        }else{
            res.render('admin/adminLogin',{ message:"your not a admin" })
        }
       
      
    } catch(error){
        console.log(error.message);
    }
}
const userDashboard = async (req,res)=>{  
    const { query } = req.query
    try {
        let users;
        if (query) {
            users = await User.find({ name: { $regex: '.*' + query + '.*'}, is_admin: 0 });
        } else {
            users = await User.find({ is_admin: 0 });
        }
        return res.render('admin/dashboad', { users, query });
    } catch (error) {
        res.render('admin/dashboad')
    }
}

const user=async(req,res)=>{
    const {query}=req.query;
    try{
        let users;
        if (query) {
            users = await User.find({
                name: { $regex: '.*' + query + '.*' },
            });
        } else {
            users = await User.find({});
        }
      
        res.render('admin/users', { users, query });
    } catch (error) {
        
        console.error(error);
        res.render('admin/dashboard'); 
    }
};


const blockUser = async (req, res) => {
    try {
        console.log('Session before destroy:', req.session);
        const id = req.params.userId;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       
            user.is_blocked = !user.is_blocked;
            await user.save();

           
       
        res.redirect("/admin/users");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




    const unblockUser = async (req, res) => {
        try {
            const id = req.params.userId;
    
            console.log(`Attempting to unblock user with ID: ${id}`);
    
            const user = await User.findById(id);
    
            if (!user) {
                console.log(`User with ID ${id} not found`);
                return res.status(404).json({ message: 'User not found' });
            }
    
            user.is_blocked = false;
    
            await user.save();
    
            console.log(`User with ID ${id} unblocked successfully`);
            res.redirect("/admin/users");
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };

    /////Category/////

    const categories = async (req, res) => {
        try {
          const categories = await Category.find({});
          console.log("cateeeee",categories);
          res.render('admin/category', { categories: categories }); 
        } catch (error) {
          console.error(error);
          res.status(500).send("Error occurred");
        }
      }
      
    


      const categori = async (req, res) => {
        try {
            const categories = await Category.find({});
            let message = '';
            res.render('admin/addcategory', { category: categories, message });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error occurred");
        }
    };
    





        const addcategories=async(req,res)=>{
            res.render('admin/category')
        }


        const addcategory = async (req, res) => {
          try {
              const { CategoryName, discountprice } = req.body;
              console.log(req.body);
      
              if (!CategoryName || discountprice === undefined) {
                  return res.status(400).send('Category name and discount price are required');
              }
      
              const existingCategory = await Category.findOne({ category: CategoryName });
              if (existingCategory) {
                  return res.render('admin/addcategory', { message: 'Category already exists' });
              }
      
              const newCategory = new Category({
                  category: CategoryName,
                  discountPrice: discountprice,
              });
      
              await newCategory.save();
              res.redirect('/admin/category');
          } catch (error) {
              console.error('Error adding category:', error);
              res.status(500).send('Error adding category: ' + error.message);
          }
      };
      

    
const deleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId; 
    try {
      const deletedCategory = await Category.findByIdAndRemove(categoryId);
      if (deletedCategory) {
        res.status(200).send("Category deleted successfully");
      } else {
        res.status(404).send('Category not found');
      }
    } catch (error) {
      console.error('Error deleting the category', error);
      res.status(500).send("An error occurred while deleting the category");
    }
  };
  


  const editcategoryform = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);

        if (!category) {
            res.status(404).send('Category not found');
            return;
        }

        let message=''
        res.render('admin/editcategory', {message,category }); 
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).send('An error occurred while fetching the category');
    }
};




const editcategory = async (req, res) => {
  const categoryId = req.params.categoryId;

  try {
      const { CategoryName, discountPrice } = req.body;
      console.log(req.body);


     

      const updatedCategory = await Category.findByIdAndUpdate(
          categoryId,
          { category: CategoryName, discountPrice: discountPrice },
          { new: true }
      );
    const productsToUpdate = await Product.find({ productCategory: categoryId });

    for (const product of productsToUpdate) {
      product.offerPrice = product.productPrice - (discountPrice * product.productPrice) / 100;
      await product.save();
    }
      const existingCategory = await Category.find({});
      console.log("existing",existingCategory);
      console.log("SAD",updatedCategory.category);
    
      const hasDuplicateCategory = existingCategory.some(category => 
        category.category.toLowerCase() === CategoryName.toLowerCase() && category._id.toString() !== categoryId
      );

      if (hasDuplicateCategory) {
          return res.render('admin/editcategory', { category: updatedCategory, message: 'Category already exists' });
      }

      console.log('MongoDB Update Query:', { category: CategoryName, discountPrice: discountPrice });

      if (updatedCategory) {
          res.redirect('/admin/category');
      } else {
          res.status(404).send('Category not found');
      }
  } catch (error) {
      console.error('Error editing the category', error);
      res.status(500).send('An error occurred while editing the category');
  }
};

/////Product//////

const products = async (req, res) => {
    try {
        const products = await Product.find({}).populate('productCategory');
        const productImages = products.map(product => product.productImage);
        console.log(products,'productImages', productImages);
        res.render("admin/product", { products, productImages });
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while loading the products.");
    }
}




const form=async(req,res)=>{
    res.render('admin/addproduct')
}
const addproduct= async (req,res)=>{
    const category=await Category.find({})
    console.log("Category",category);
    res.render('admin/addproduct',{category})
}
const addproducts = async (req, res) => {
    console.log(req.body);
    // console.log(req.files);

    try {
        if(!req.files || req.files.length===0){
            return res.render('admin/addproduct',{error:'please upload atleast one image'})
        }


        const productImages = req.files.map(file => ({
            filename: file.originalname, 
            data: file.buffer, 
            contentType: file.mimetype 
        }));

        const productPrice = parseFloat(req.body.productPrice);


        if (productPrice < 0) {
            return res.render('admin/addproduct', { error: "Product price cannot be negative" });
        }
        console.log(req.body);
        const selectedCategoryId = req.body.productCategory;
        const selectedCategory = await Category.findById(selectedCategoryId);
        const discountPrice = selectedCategory.discountPrice;
        const offerPrice = productPrice - (discountPrice * productPrice / 100);
        const newProduct = new Product({
            productName: req.body.productName,
            productImage: productImages, 
            productPrice: productPrice,
            productDescription: req.body.productDescription,
            productCategory: req.body. productCategory,
            productStock:req.body.productStock,
            offerPrice: offerPrice,
        });

        const savedProduct = await newProduct.save();
        if (savedProduct) {
            console.log('Product saved successfully:', savedProduct);
            res.redirect('/admin/products');
        } else {
            console.error('Failed to save product.');
            res.render('admin/addproduct', { error: 'Error adding the product', category });
        }
    } catch (error) {
        console.error('Error adding product:', error);
        const category = await Category.find({});
        res.render('admin/addproduct', { error: 'Error adding the product', category });
    }
}
const deleteProduct= async (req,res)=>{
    const productId=req.params.productId;
    try{
        const deleteProduct= await Product.findByIdAndRemove(productId)
        if(deleteProduct){
            res.status(200).send("Product deleted successfully")
        }else{
            res.status(404).send("Product not found")
        }
    } catch(error){
        console.error('Error deleting product:',error)
        res.status(500).send("Error occur while deleting product")
    }
}


const editProductForm = async (req,res) => {
    const productId= req.params.productId;
    const product= await Product.findById(productId)
    const category= await Category.find()
    console.log(category);
    if(!product){
        res.status(404).send("Product not found");
        return;
    }

    res.render('admin/editproduct',{product,category})
};

const editProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404).send("Product not found");
      return;
    }

    // Store the original product price for comparison
    const originalProductPrice = product.productPrice;

    product.productName = req.body.productName;
    const productPrice = parseFloat(req.body.productPrice);

    if (productPrice < 0) {
      return res.render('admin/editproduct', {
        product,
        error: "Product price cannot be negative",
      });
    }

    // Update the product price
    product.productPrice = productPrice;
    product.productDescription = req.body.productDescription;
    product.productCategory = req.body.productCategory;
    product.productStock = req.body.productStock;

    // Calculate and update offerPrice if productPrice has changed
    if (originalProductPrice !== productPrice) {
      const category = await Category.findById(product.productCategory);
      const discountPrice = category ? category.discountPrice : 0;

      // Perform the offerPrice calculation
      product.offerPrice = productPrice - (discountPrice * productPrice) / 100;
    } else {
      // If productPrice hasn't changed, keep the existing offerPrice
      product.offerPrice = product.offerPrice || 0;
    }

    if (req.files && req.files.length > 0) {
      product.productImage = req.files.map((file) => ({
        filename: file.originalname,
        data: file.buffer,
        contentType: file.mimetype,
      }));
    }

    const updatedProduct = await product.save();

    if (updatedProduct) {
      res.redirect('/admin/products');
    } else {
      res.render('admin/editproduct', { product, error: "Error updating the product" });
    }
  } catch (error) {
    console.error("Error editing product:", error);
    res.status(500).send("An error occurred while editing");
  }
};


const listProduct=async(req,res)=>{
    const productId=req.params.productId
    const isListed=req.body.isListed;
    try {
        const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
        }
    
        product.isListed = isListed; 
        await product.save();
        res.status(200).json({ message: "Product listing status updated" });
      } catch (error) {
        console.error("Error toggling product listing:", error);
        res.status(500).json({ message: "Error updating product listing status" });
      }
    };

    const order=async(req,res)=>{
        try{
            const orders=await Order.find({})
            console.log(orders,'kkkkkkkkkkkkkkkkkk');
            res.render('admin/order',{orders})
        }catch(error){
            console.error(error);
            res.status(500).send('Error fetching orders')
        }
    }

    const updateOrder = async (req, res) => {
        const orderId = req.params.orderId;
      
        try {
          const order = await Order.findById(orderId);
      
          if (!order) {
            return res.status(404).send("Order not found");
          }
      
          order.status = req.body.status || 'Shipped'; 
          await order.save();
          res.redirect('/admin/orders');
        } catch (error) {
          console.error(error);
          res.status(500).send(`Internal Server Error: ${error.message}`);
        }
      };
      
      const cancelOrder = async (req, res) => {
        const orderId = req.params.orderId;
      
        try {
          const order = await Order.findById(orderId);
      
          if (!order) {
            return res.status(404).send("Order not found");
          }
          for (const product of order.products) {
            const productId = product.productId;
            const quantityToReturn = product.quantity;
            const existingProduct = await Product.findById(productId);
      
            if (!existingProduct) {
              console.error(`Product with ID ${productId} not found.`);
              continue;
            }
            existingProduct.productStock += quantityToReturn;
            await existingProduct.save();
          }
          order.cancelled = true;
          await order.save();
          res.redirect('/admin/orders');
        } catch (error) {
          console.error(error);
          res.status(500).send(`Internal Server Error: ${error.message}`);
        }
      };

      const deleteExpiredCoupons = async () => {
        try {
          await Coupon.deleteMany({ expiryDate: { $lt: new Date() } });
        } catch (error) {
          console.error('Error deleting expired coupons:', error);
        }
      };
      const coupons = async (req, res) => {
        try {
            await deleteExpiredCoupons()
            const coupons = await Coupon.find({}).populate('couponApplicable');
            res.render("admin/coupon", { coupons});

        } catch (error) {
            console.error(error);
            res.status(500).send("An error occurred while loading the coupons.");
        }
    }
    
    const couponCode= async (req,res)=>{
        await deleteExpiredCoupons()
        const coupon=await Coupon.find({})
        
        const category=await Category.find({})
        res.render('admin/addcoupon',{coupon,category})
    }

    const addcoupons = async (req, res) => {
        try {
            const { couponcode, discountprice, minimumprice, expirydate, couponApplicable } = req.body;
            console.log('Request Body:', req.body);
            const existingCoupon = await Coupon.findOne({ couponCode: couponcode });
            const category = await Category.find({});
    
            if (existingCoupon) {
                return res.render('admin/addcoupon', { message: 'Coupon code already exists', category });
            }
    
            if (parseFloat(minimumprice) <= parseFloat(discountprice)) {
                return res.render('admin/addcoupon', { message: 'Minimum price should be greater than discount price' });
            }
    
            let newCoupon;
    
            if (couponApplicable === "all") {
                newCoupon = new Coupon({
                    couponCode: couponcode,
                    discountPrice: parseFloat(discountprice),
                    minimumPrice: parseFloat(minimumprice),
                    expiryDate: new Date(expirydate),
                    
                    isActive: true,
                });
            } else {
                newCoupon = new Coupon({
                    couponCode: couponcode,
                    discountPrice: parseFloat(discountprice),
                    minimumPrice: parseFloat(minimumprice),
                    expiryDate: new Date(expirydate),
                    couponApplicable: req.body.couponApplicable,
                    isActive: true,
                });
            }
    console.log("asd",newCoupon);
            const savedCoupon = await newCoupon.save();
            await deleteExpiredCoupons();
            res.redirect('/admin/coupons');
        } catch (error) {
            console.error('Error adding coupon:', error);
            res.render('error', { error: 'Error adding coupon' });
        }
    };
    
    const deleteExpiredBanner = async () => {
        try {
          await Banner.deleteMany({ expiryDate: { $lt: new Date() } });
        } catch (error) {
          console.error('Error deleting expired banner:', error);
        }
      };
     const loadbanner=async(req,res)=>{
        try{
            await deleteExpiredBanner()
            const banners=await Banner.find()
            res.render('admin/banner',{banners})
          }catch(error){
            console.error('error fetching bannners:',error)
              res.status(500).send('Internal server error')
          }
     }

     const addbanner=async(req,res)=>{
        await deleteExpiredBanner()
        const banners=await Banner.find({})
        res.render('admin/addbanner',{banners})
     }

    

     const createBanner=async(req,res)=>{
        const { title, description, couponCode, discountPercentage, expiryDate, isActive } = req.body;
        console.log(req.file);
        const bannerImage = {
            filename: req.file.filename,
            data: req.file.buffer,
            contentType: req.file.mimetype,
         };
          try{
            const newBanner= new Banner({
                title, 
                description,
                couponCode,
                discountPercentage,
                expiryDate,
                isActive: isActive === 'on', 
                bannerImage    
            })
            await newBanner.save()
            res.redirect('/admin/banner')
        } catch (error) {
            console.error("Error while creating banner:", error);
            res.status(500).send("Internal Server Error");
         }
     }

     const editBanner = async (req, res) => {
        try {
            const banner = await Banner.findById(req.params.id);
            res.render('admin/editbanner', { banner });
        } catch (error) {
            console.error('Error fetching banner for editing:', error);
            res.status(500).send('Internal Server Error');
        }
      };
      const updateBanner=async(req,res)=>{
        const { title, description, couponCode, discountPercentage, expiryDate, isActive } = req.body;

        const updatedBanner = {
            title,
            description,
            couponCode,
            discountPercentage,
            expiryDate,
            isActive: isActive === 'on',
        };
      
        if (req.file) {
            updatedBanner.bannerImage = {
                filename: req.file.filename,
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }
        try{
            await Banner.findByIdAndUpdate(req.params.id,updatedBanner);
            res.redirect('/admin/banner')

        }catch(error){
            console.error("error while updating");
        }
      }

      const getSalesData = async (req, res) => {
        try {
          const dailySalesData = await Order.aggregate([
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                total: { $sum: '$total' },
              },
            },
            { $sort: { '_id': 1 } },
          ]);
      
          const weeklySalesData = await Order.aggregate([
            {
              $group: {
                _id: { $week: '$date' },
                total: { $sum: '$total' },
              },
            },
            { $sort: { '_id': 1 } },
          ]);
      
          const yearlySalesData = await Order.aggregate([
            {
              $group: {
                _id: { $year: '$date' },
                total: { $sum: '$total' },
              },
            },
            { $sort: { '_id': 1 } },
          ]);
      
          const dailyLabels = dailySalesData.map(day => day._id);
          const dailySales = dailySalesData.map(day => day.total);
      
          const weeklyLabels = weeklySalesData.map(week => `Week ${week._id}`);
          const weeklySales = weeklySalesData.map(week => week.total);
      
          const yearlyLabels = yearlySalesData.map(year => `Year ${year._id}`);
          const yearlySales = yearlySalesData.map(year => year.total);
      
          res.json({ dailyLabels, dailySales, weeklyLabels, weeklySales, yearlyLabels, yearlySales });
        } catch (error) {
          console.error('Error fetching sales data:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      };
      
    
    
    
    
      const totalUsers=async(req,res)=>{
        try {
          const totalUsers = await User.countDocuments();
          res.json({ totalUsers });
        } catch (error) {
          console.error('Error fetching total users:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      };
    
    
    
    
    
      const generateReport = async (req, res) => {
        try {
          const { startDate, endDate } = req.query;
      
          const orders = await Order.find({
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
          });
      
          const doc = new PDFDocument();
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=orders-report.pdf`);
      
          doc.pipe(res);
          doc.fontSize(16).text('Orders Report', { align: 'center' });
      
          orders.forEach((order, index) => {
            doc.moveDown().fontSize(14).text(`Order ${index + 1} Details:`);
      
            doc.text(`Order ID: ${order._id}`);
            doc.text(`Date: ${order.date}`);
            doc.text(`Total: $${order.total.toFixed(2)}`);
      
            doc.moveDown().fontSize(12).text('Products:');
      
            order.products.forEach(product => {
              doc.text(`- ${product.productName}, Quantity: ${product.quantity}, Price: $${product.productPrice.toFixed(2)}`);
            });
      
            doc.moveDown().fontSize(12).text('Delivery Address:');
      
            const address = order.address[0]; 
            doc.text(`Name: ${address.name}`);
            doc.text(`Number: ${address.number}`);
            doc.text(`House: ${address.house}`);
            doc.text(`City: ${address.city}`);
            doc.text(`State: ${address.state}`);
            doc.text(`Pincode: ${address.pincode}`);
            doc.text(`Delivery Point: ${address.delivery_point}`);
      
            doc.moveDown(); 
          });
      
          doc.end();
        } catch (error) {
          console.error('Error generating orders report:', error);
          res.status(500).send('Internal Server Error: ' + error.message);
        }
      };
    
    
    
    
      
        const totalRevenue=async(req,res)=>{
          try {
            const totalRevenue = await Order.aggregate([
              {
                $group: {
                  _id: null,
                  total: { $sum: '$total' } 
                }
              }
            ]);
            
            res.json({
              totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
            });
          } catch (error) {
            console.error('Error fetching total revenue:', error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
      
    

const logout = (req, res) => {
    req.session.destroy()
    res.redirect('/admin/login')
}





module.exports = {
    adminValid,
    loadAdmin,
    userDashboard,
    products,
    form,
    addproduct,
    addproducts,
    deleteProduct,
    editProductForm,
    editProduct,
    listProduct,
    user,
    blockUser,
    unblockUser,
    categories,
    categori,
    addcategories,
    addcategory,
    deleteCategory,
    editcategoryform,
    editcategory,
    order,
    updateOrder,
    cancelOrder,
    coupons,
    couponCode,
    addcoupons,
    loadbanner,
    addbanner,
    createBanner,
    editBanner,
    updateBanner,
    getSalesData,
    totalUsers,
    generateReport,
    totalRevenue,
    logout
}