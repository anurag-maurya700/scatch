require("dotenv").config();
const jwt = require("jsonwebtoken");


const express = require('express');
const app = express();
app.set('trust proxy', 1);
const cookieParser = require('cookie-parser');
const path = require('path');
const expressSession = require('express-session');
const flash = require('connect-flash');
const isAdmin = require("./middlewares/isAdmin");

const User = require("./models/user-model");
const productModel = require("./models/product-model");
const isloggedin = require("./middlewares/isLoggedin");

const db = require("./config/mongoose-connection");
const ownersRouter = require("./routes/ownersRouter");
const productsRouter = require("./routes/productsRouter");
const usersRouter = require("./routes/usersRouter");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
);
app.use(flash());

/* ROUTES */
app.use("/owners", ownersRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

/* HOME PAGE (MAIN PAGE) */
app.get("/home", isloggedin, async (req, res) => {
    try {
        const search = req.query.search || "";
        const category = req.query.category || "";

        let filter = {};

        // 🔍 SEARCH FILTER
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        // 🏷 CATEGORY FILTER
        if (category) {
            filter.category = category;
        }

        const products = await productModel.find(filter);

        res.render("home", {
            user: req.user,
            products,
            search,
            category
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading products");
    }
});

/* CART */
app.get("/cart", isloggedin, async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("cart.product");

    res.render("cart", { user });
});

/* LOGOUT */
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

/* LOGIN PAGE */
app.get("/", (req, res) => {
    const token = req.cookies.token;

    if (token) {
        try {
            jwt.verify(token, process.env.JWT_KEY);
            return res.redirect("/home"); // ✅ FIXED
        } catch {}
    }

    res.render("index");
});

/* ADMIN */
app.get("/admin", isloggedin, isAdmin, (req, res) => {
    res.render("admin");
});
/* CHECKOUT */
app.get("/checkout", isloggedin, async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("cart.product");

    res.render("checkout", { user });
});
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
app.post("/create-order", isloggedin, async (req, res) => {

    const { addressIndex } = req.body;

    const user = await User.findById(req.user._id)
        .populate("cart.product");

    if (!user.cart.length) {
        return res.json({ success: false });
    }

    const selectedAddress = user.addresses[addressIndex];

    let total = 0;

    user.cart.forEach(item => {
        total += item.product.price * item.quantity;
    });

    const order = await razorpay.orders.create({
        amount: total * 100,
        currency: "INR",
        receipt: "order_" + Date.now(),
    });

    // ✅ USE SESSION (BETTER THAN tempAddress)
    req.session.orderData = {
        address: selectedAddress,
        items: user.cart,
        total
    };

    res.json({
        success: true,
        order,
        key: process.env.RAZORPAY_KEY_ID
    });
});
app.post("/cod-order", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id)
        .populate("cart.product");

    const address = user.addresses[req.body.addressIndex];

    let total = 0;
    user.cart.forEach(item => {
        total += item.product.price * item.quantity;
    });

    user.orders.push({
        items: user.cart,
        address,
        total,
        status: "Pending",
        paymentMethod: "COD",
        paymentStatus: "Pending"
    });

    user.cart = [];
    await user.save();

    res.json({ success: true });
});
app.post("/online-order", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id)
        .populate("cart.product");

    const address = user.addresses[req.body.addressIndex];

    let total = 0;
    user.cart.forEach(item => {
        total += item.product.price * item.quantity;
    });

    user.orders.push({
        items: user.cart,
        address,
        total,
        status: "Pending",
        paymentMethod: "ONLINE",
        paymentStatus: "Paid"
    });

    user.cart = [];
    await user.save();

    res.json({ success: true });
});
app.post("/admin/mark-paid/:userId/:orderId", async (req, res) => {

    const user = await User.findById(req.params.userId);
    const order = user.orders.id(req.params.orderId);

    order.paymentStatus = "Paid";

    await user.save();

    res.redirect("/admin/orders");
});
app.post("/verify-payment", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id);

    const orderData = req.session.orderData;

    if (!orderData) {
        return res.json({ success: false });
    }

    user.orders.push({
        items: orderData.items.map(item => ({
            product: item.product,
            quantity: item.quantity
        })),
        address: orderData.address,
        total: orderData.total,
        status: "Pending",
         paymentMethod: "ONLINE",   // ✅ ADD THIS
         paymentStatus: "Paid",     // ✅ ADD THIS
        createdAt: new Date()
    });

    user.cart = [];

    await user.save();

    // ✅ CLEAR SESSION
    req.session.orderData = null;

    res.json({ success: true });
});
app.get("/success", (req, res) => {
    res.render("success");
});
app.get("/orders", isloggedin, async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("orders.items.product");

    res.render("orders", { user });
});

app.get("/admin/orders", isloggedin, isAdmin, async (req, res) => {

    const users = await User.find()
        .populate("orders.items.product");

    res.render("admin-orders", { users });
});
app.post("/admin/update-order/:userId/:orderId", isloggedin, isAdmin, async (req, res) => {
    const { status } = req.body;

    let user = await User.findById(req.params.userId);

    let order = user.orders.id(req.params.orderId);

    if (order) {
        order.status = status;
        await user.save();
    }

    res.redirect("/admin/orders");
});

app.get("/product/:id", isloggedin, async (req, res) => {
    const product = await productModel.findById(req.params.id);

    res.render("product-details", { product });
});
app.get("/track/:orderId", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id);

    const order = user.orders.id(req.params.orderId);

    res.render("track", { order });
});
app.get("/get-location/:orderId", async (req, res) => {

    let user = await User.findOne({ "orders._id": req.params.orderId });

    let order = user.orders.id(req.params.orderId);

    res.json({
        location: order.location
    });
});
// ➕ ADD ADDRESS
app.post("/add-address", isloggedin, async (req, res) => {

    let user = await User.findById(req.user._id);

    user.addresses.push(req.body);

    await user.save();

    res.redirect("/checkout");
});
app.post("/delete-address/:index", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id);

    user.addresses.splice(req.params.index, 1);

    await user.save();

    res.redirect("/checkout");
});
app.post("/update-location/:orderId", async (req, res) => {

    const { lat, lng } = req.body;

    let user = await User.findOne({ "orders._id": req.params.orderId });

    let order = user.orders.id(req.params.orderId);

    order.location = { lat, lng };

    await user.save();

    res.json({ success: true });
});
app.get("/delivery/:orderId", isloggedin, async (req, res) => {

    const user = await User.findById(req.user._id);
    const order = user.orders.id(req.params.orderId);

    res.render("delivery", { order });
});
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // 📍 DELIVERY LOCATION UPDATE
    socket.on("delivery-location", async ({ orderId, lat, lng }) => {

        let user = await User.findOne({ "orders._id": orderId });
        let order = user.orders.id(orderId);

        // SAVE LOCATION
        order.location = { lat, lng };

        // AUTO STATUS
        if (order.status === "Pending") {
            order.status = "Shipped";
        }

        if (order.status === "Shipped") {
            const destLat = 25.3176; // demo (later use real address)
            const destLng = 82.9739;

            const distance = Math.abs(destLat - lat) + Math.abs(destLng - lng);

            if (distance < 0.01) {
                order.status = "Delivered";
            }
        }

        await user.save();

        // 🔥 REALTIME SEND TO USER
        io.emit(`track-${orderId}`, { lat, lng });

    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });

});
// PROFILE PAGE
app.get("/profile", isloggedin, (req, res) => {
    res.render("profile", { user: req.user });
});

// UPDATE PROFILE
app.post("/profile/update", isloggedin, async (req, res) => {
    const { fullname, contact } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
        fullname,
        contact
    });

    res.redirect("/profile");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running...");
});