const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  fullname: {
    type:String,
    minLength:3,
    trim:true,
  },
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["user", "admin", "delivery"],
    default: "user"
},
 cart: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product"
    },
    quantity: {
      type: Number,
      default: 1
    }
  }
],
 orders: [
  {
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product"
        },
        quantity: Number
      }
    ],
    address: {
      fullname: String,
      phone: String,
      pincode: String,
      city: String,
      state: String,
      addressLine: String,
      landmark: String
    },
      status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered"],
      default: "Pending"
    },

    // ✅ ADD THIS (for socket fix)
    manualUpdate: {
      type: Boolean,
      default: false
    },

   paymentMethod: {
    type: String,
    default: "COD"
},
paymentStatus: {
    type: String,
    default: "Pending" // Paid / Pending

    },
    createdAt: {
      type: Date,
      default: Date.now
    },
   location: {
    lat: Number,
    lng: Number
},
deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
  }
],
  contact: Number,
  picture: String,
  addresses: [
  {
    fullname: String,
    phone: String,
    pincode: String,
    city: String,
    state: String,
    addressLine: String,
    landmark: String
  }
],
});
module.exports= mongoose.model("user", userSchema);