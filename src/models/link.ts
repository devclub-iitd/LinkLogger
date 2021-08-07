const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linkSchema = new Schema(
  {
    short_link: {
      type: String,
      required: true,
      unique: true,
    },
    original_link: {
      type: String,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
      default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    is_in_tree: {
      type: Boolean,
      default: false,
    },
  },
  {timestamps: true}
);

const linkMap = mongoose.model('linkMap', linkSchema);
export default linkMap;
