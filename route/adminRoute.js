const express = require("express");
const admin_route = express.Router();
const adminController = require("../controllers/admincontroller");
const Auth = require("../middleware/auth");
const uploadMulter = require("../middleware/multer");

admin_route.get("/", Auth.logoutAdmin, adminController.loadAdmin);

admin_route.post("/", Auth.logoutAdmin, adminController.adminValid);

admin_route.get("/dashboad", Auth.loggedadmin, adminController.userDashboard);


admin_route.get("/products", Auth.loggedadmin, adminController.products);
admin_route.get("/addproduct", Auth.loggedadmin, adminController.addproduct);
admin_route.post(
  "/addproduct",
  Auth.loggedadmin,
  uploadMulter.array("productImage", 5),
  adminController.addproducts
);
admin_route.delete("/deleteproduct/:productId", adminController.deleteProduct);
admin_route.get(
  "/editproduct/:productId",
  Auth.loggedadmin,
  adminController.editProductForm
);
admin_route.post(
  "/editproduct/:productId",
  Auth.loggedadmin,
  uploadMulter.array("productImage", 5),
  adminController.editProduct
);
admin_route.post(
  "/listingproduct/:productId",
  Auth.loggedadmin,
  adminController.listProduct
);

admin_route.get("/users", Auth.loggedadmin, adminController.user);
admin_route.get("/blockuser/:userId", Auth.loggedadmin, adminController.blockUser);

admin_route.get(
  "/unblockuser/:userId",
  Auth.loggedadmin,
  adminController.unblockUser
);

admin_route.get("/category", Auth.loggedadmin, adminController.categories);
admin_route.get("/categories", Auth.loggedadmin, adminController.categori);
admin_route.get(
  "/addcategories",
  Auth.loggedadmin,
  adminController.addcategories
);
admin_route.post("/addcategory", Auth.loggedadmin, adminController.addcategory);
admin_route.delete(
  "/deletecategory/:categoryId",
  Auth.loggedadmin,
  adminController.deleteCategory
);
admin_route.get(
  "/editcategory/:categoryId",
  Auth.loggedadmin,
  adminController.editcategoryform
);
admin_route.post(
  "/editcategory/:categoryId",
  Auth.loggedadmin,
  adminController.editcategory
);

admin_route.post("/logout", Auth.loggedadmin, adminController.logout);


admin_route.get('/orders',Auth.loggedadmin,adminController.order)
admin_route.post("/orders/:orderId", Auth.loggedadmin, adminController.updateOrder);
admin_route.post('/orders/cancel/:orderId', Auth.loggedadmin, adminController.cancelOrder);

admin_route.get("/coupons", Auth.loggedadmin, adminController.coupons);
admin_route.get("/addcoupon", Auth.loggedadmin, adminController.couponCode);
admin_route.post("/addcoupon", Auth.loggedadmin, adminController.addcoupons);

admin_route.get('/banner',Auth.loggedadmin,adminController.loadbanner)
admin_route.get('/addbanner',Auth.loggedadmin,adminController.addbanner)
admin_route.post('/addbanner', Auth.loggedadmin, uploadMulter.single('bannerImage'), adminController.createBanner);
admin_route.get('/editbanner/:id',Auth.loggedadmin,adminController.editBanner)
admin_route.post('/editbanner/:id', Auth.loggedadmin, uploadMulter.single('bannerImage'), adminController.updateBanner);

admin_route.get('/dashboard/sales-data',Auth.loggedadmin, adminController.getSalesData);
admin_route.get('/dashboard/total-users',Auth.loggedadmin,adminController.totalUsers)
admin_route.get('/dashboard/orders-report', Auth.loggedadmin, adminController.generateReport);
admin_route.get('/dashboard/total-revenue',Auth.loggedadmin,adminController.totalRevenue)

admin_route.get("/logoutAdmin", Auth.logouting);

module.exports = admin_route;
