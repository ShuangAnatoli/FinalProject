const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    habitName: String,
    progress: Number,
    start : Date
  });


const Habit = new mongoose.model("Habit", habitSchema);
module.exports = Habit;