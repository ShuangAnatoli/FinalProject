const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    user: {type: Schema.Types.ObjectId, ref:'User'},
    content : String,
    reflection : String,
    mood : Number,
    entryDate : Date
  });

const Journal = new mongoose.model("Journal", journalSchema);

module.exports = Journal;