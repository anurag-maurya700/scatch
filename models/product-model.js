const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  image: String,
  name: String,
  price: Number,
  category: String,
   stock: {
        type: Number,
        default: 0
    },
    inStock: {
        type: Boolean,
        default: true
    },

    lowStock: {
        type: Boolean,
        default: false
    },
  discount: {
    type: Number,
    default: 0,
  },
  reviews: [
  {
    rating: Number,
    comment: String
  }
],

questions: [
  {
    question: String,
    answer: String,
    askedBy: String,
    answeredBy: String
  }
],
  bgcolor: String,
  pannelcolor: String,
  textcolor: String,
});
module.exports = mongoose.model("product", productSchema);
