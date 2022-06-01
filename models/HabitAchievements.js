const mongoose = require('mongoose');

const habitAchievementSchema = new mongoose.Schema({
    name: String,
    conditions: String
  });

const HabitAchievement = new mongoose.model("HabitAchievement", habitAchievementSchema);
module.exports = HabitAchievement;