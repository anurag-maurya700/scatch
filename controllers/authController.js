const userModel = require("../models/user-model");
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const { generateToken }=require("../utils/generateToken");


module.exports.registerUser = async function (req, res) {
  try {
    let { email, fullname, password } = req.body;

    if (!email || !fullname || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    let existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    let user = await userModel.create({
      email,
      fullname,
      password: hash,
    });

    let token = generateToken(user);

    res.cookie("token", token, { httpOnly: true });

    res.json({ success: true, message: "Account created successfully" });

  } catch (err) {
    res.json({ success: false, message: "Something went wrong" });
  }
};
module.exports.loginUser = async function (req, res) {
  try {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    let token = generateToken(user);

    res.cookie("token", token, { httpOnly: true });

    res.json({ success: true, message: "Login successful" });

  } catch (err) {
    res.json({ success: false, message: "Something went wrong" });
  }
};