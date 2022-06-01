const mongoose = require('mongoose');

const sobrietyCheckSchema = new mongoose.Schema({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    soberID: {type: Schema.Types.ObjectId, ref:'SobrietyTrack'},
    soberName : {type: Schema.Types.String, ref:'SobrietyTrack'},
    checkin : [{
      check : Boolean,
      date : Date
    }],
    progress: Number,
    achievement: Number
  });

const SobrietyCheck = new mongoose.model("SobrietyCheck", sobrietyCheckSchema);
module.exports = SobrietyCheck;