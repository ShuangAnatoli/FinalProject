const mongoose = require('mongoose');

const userdetailSchema = new mongoose.Schema ({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    age: Number,
    gender: String,
    phqScore: Number
});

const UserDetail = new mongoose.model("UserDetail", userdetailSchema);

module.exports = UserDetail;