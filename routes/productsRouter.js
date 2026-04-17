const express = require("express");
const router = express.Router();
const isloggedin = require("../middlewares/isLoggedin");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");


router.get("/add-to-cart/:id", isloggedin, async (req, res) => {

    if (!req.user) {
        return res.redirect("/");
    }

    let user = await userModel.findById(req.user._id);

    if (!user) {
        return res.redirect("/");
    }

    let itemIndex = user.cart.findIndex(
        item => item.product.toString() === req.params.id
    );

    if (itemIndex > -1) {
        user.cart[itemIndex].quantity += 1;
    } else {
        user.cart.push({
            product: req.params.id,
            quantity: 1
        });
    }

    await user.save();

    res.redirect("/home");
});
router.get("/remove-from-cart/:id", isloggedin, async (req, res) => {
    let user = await userModel.findById(req.user._id);

    user.cart = user.cart.filter(
        item => item.product.toString() !== req.params.id
    );

    await user.save();

    res.redirect("/cart");
});

// 👉 Admin: Add product
router.post("/add", async (req, res) => {
    const { name, price, image, category } = req.body;

    await productModel.create({
        name,
        price,
        image,
        category,
    });

    res.redirect("/home");
});
// ➕ INCREASE QUANTITY
router.get("/increase/:id", isloggedin, async (req, res) => {
    let user = await userModel.findById(req.user._id);

    let itemIndex = user.cart.findIndex(
        item => item.product.toString() === req.params.id
    );

    if (itemIndex > -1) {
        user.cart[itemIndex].quantity += 1;
    }

    await user.save();
    res.redirect("/cart");
});
// ➖ DECREASE QUANTITY
router.get("/decrease/:id", isloggedin, async (req, res) => {
    let user = await userModel.findById(req.user._id);

    let itemIndex = user.cart.findIndex(
        item => item.product.toString() === req.params.id
    );

    if (itemIndex > -1) {
        if (user.cart[itemIndex].quantity > 1) {
            user.cart[itemIndex].quantity -= 1;
        }
        // ❌ DO NOTHING if quantity is 1
    }

    await user.save();
    res.redirect("/cart");
});
router.post("/add-to-cart-ajax/:id", isloggedin, async (req, res) => {
    let user = await userModel.findById(req.user._id);

    let itemIndex = user.cart.findIndex(
        item => item.product.toString() === req.params.id
    );

    if (itemIndex > -1) {
        user.cart[itemIndex].quantity += 1;
    } else {
        user.cart.push({
            product: req.params.id,
            quantity: 1
        });
    }

    await user.save();

    // 🔥 send total count
    const count = user.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.json({ success: true, count });
});
router.post("/increase-ajax/:id", isloggedin, async (req, res) => {

    let user = await userModel.findById(req.user._id).populate("cart.product");

    let item = user.cart.find(i => i.product._id.toString() === req.params.id);

    if (item) item.quantity++;

    await user.save();

    let total = 0;
    user.cart.forEach(i => total += i.product.price * i.quantity);

    res.json({
        success: true,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        total,
        count: user.cart.length
    });
});
router.post("/decrease-ajax/:id", isloggedin, async (req, res) => {

    let user = await userModel.findById(req.user._id).populate("cart.product");

    let item = user.cart.find(i => i.product._id.toString() === req.params.id);

    if (item && item.quantity > 1) item.quantity--;

    await user.save();

    let total = 0;
    user.cart.forEach(i => total += i.product.price * i.quantity);

    res.json({
        success: true,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        total
    });
});
router.post("/remove-from-cart-ajax/:id", isloggedin, async (req, res) => {

    let user = await userModel.findById(req.user._id).populate("cart.product");

    user.cart = user.cart.filter(
        item => item.product._id.toString() !== req.params.id
    );

    await user.save();

    let total = 0;
    user.cart.forEach(i => total += i.product.price * i.quantity);

    res.json({
        success: true,
        total,
        count: user.cart.length
    });
});

module.exports = router;