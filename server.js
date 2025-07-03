const mongoose = require("mongoose");
const app = require("./app"); // ✅ Use the configured app
// Remove redundant express.json and express.urlencoded usage here. They are already set up in app.js
const multer = require("multer");
const path = require("path");

// Remove redundant express.json and express.urlencoded usage here. They are already set up in app.js

// Import routes
const authRoutes = require("./routes/auth");
const packageRoutes = require("./routes/package");
const adminRoutes = require("./routes/admin");
const superadminRoutes = require('./routes/superadmin');
const salonRoutes = require('./routes/salon');
const managerRoutes = require('./routes/manager');
const serviceRoutes = require('./routes/service');
const staffRoutes = require('./routes/staff');
const branchRoutes = require('./routes/branch');
const categoriesRoutes = require('./routes/category');
const subcategoriesRoutes = require('./routes/subcategory');
const customerRoutes = require('./routes/customer');
const branchPackageRoutes = require('./routes/branchPackage');
const couponRoutes = require('./routes/coupon');
const appointmentRoutes = require('./routes/appointment');
const brandRoutes = require('./routes/brand');
const productCategoriesRoutes = require('./routes/productCategory');
const productSubCategoriesRoutes = require('./routes/productSubCategory');
const unitRoutes = require('./routes/units');
const tagRoutes = require('./routes/tag');
const variationRoutes = require('./routes/variation'); 
const reviewRoutes = require('./routes/review');
const paymentRoutes = require('./routes/payment');
const taxRoutes = require('./routes/tax');
const productRoutes = require('./routes/product');
const roleRoutes = require('./routes/role');
const appBannerRoutes = require('./routes/appBanner');
const revenueRoutes = require('./routes/revenue');
const dashboardRoutes = require('./routes/dashboard');
const staffEarningRoutes = require("./routes/staffEarning"); 
const customerPackageRoutes = require("./routes/customerPackage");
const dailyBookingRoutes = require("./routes/dailyBooking");
const staffDetailsRoutes = require("./routes/staffDetails");
const quickBookingRoutes = require("./routes/quickBooking");
const currencyRoutes = require("./routes/currency");
const branchMembershipRoutes = require("./routes/branchMembership");
const customerMembershipRoutes = require("./routes/customerMembership");
const revenueCommissionRoutes = require("./routes/revenueCommission");
const staffRevenueRoutes = require("./routes/staffRevenue");
const staffPaymentsRoutes = require("./routes/staffPayments");
const orderRoutes = require('./routes/order').router;
// const statusUpdateRoutes = require('./routes/statusUpdate');
// const generalRoutes = require("./routes/general");


// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/salon_admin")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Configure multer for global use
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png"];
    const ext = require("path").extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only .jpg, .jpeg, and .png formats are allowed!"), false);
    }
};

const upload = multer({ storage, fileFilter });

// Apply routes
app.use("/api/auth", authRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", superadminRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/staffs", staffRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/branchPackages", branchPackageRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/productCategories", productCategoriesRoutes);
app.use("/api/productSubCategories", productSubCategoriesRoutes); 
app.use("/api/units", unitRoutes);
app.use("/api/tags", tagRoutes);  
app.use("/api/variations", variationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/products", productRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/appBanners", appBannerRoutes);
app.use("/api/revenues", revenueRoutes);  
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/customerPackages", customerPackageRoutes);
app.use("/api/dailyBookings", dailyBookingRoutes); 
app.use("/api/staffEarnings", staffEarningRoutes);
app.use("/api/staff-services-reports", staffDetailsRoutes);
app.use("/api/quick-booking", quickBookingRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/branch-memberships", branchMembershipRoutes);
app.use("/api/customer-memberships", customerMembershipRoutes);
app.use("/api/revenue-commissions", revenueCommissionRoutes);
app.use("/api/staff-revenue", staffRevenueRoutes);
app.use("/api/staff-payouts", staffPaymentsRoutes);
app.use("/api/order", orderRoutes);
// app.use("/api/statusUpdates", statusUpdateRoutes);
// app.use("/api/general", generalRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});