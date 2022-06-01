const mongoose = require('mongoose');

const sobrietyTrackSchema = new mongoose.Schema({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    name: String,
    reason: String,
    startDate: Date
  });
  

const SobrietyTrack = new mongoose.model("SobrietyTrack", sobrietyTrackSchema);

module.exports = SobrietyTrack;