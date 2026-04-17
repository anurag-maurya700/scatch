const mongoose = require("mongoose");
const dbgr= require("debug")("development:mongoose");
const config= require('config');
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

module.exports= mongoose.connection;