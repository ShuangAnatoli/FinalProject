const mongoose = require('mongoose');

const habitTrackerSchema = new mongoose.Schema({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    habit: {type: Schema.Types.ObjectId, ref:'Habit'},
    checkin : [{
      check : Boolean,
      date : Date
    }],
    progress: Number,
    achievement: Number,
    gainedAchievements: [{
      name: {type: Schema.Types.String, ref:'HabitAchievement'}
    }]
  });


  const HabitTracker = new mongoose.model("HabitTracker", habitTrackerSchema);


module.exports = HabitTracker;