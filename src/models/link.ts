const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linkSchema = new Schema({
  short_link: {
    type:String,
    required:true
  },
  original_link: {
    type:String,
    required:true
  }
},{timestamps:true});

const linkMap = mongoose.model('Link_map',linkSchema);
export default linkMap;