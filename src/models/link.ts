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
    // users: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //   }
    // ],
  },
  {timestamps: true}
);

const linkMap = mongoose.model('linkMap', linkSchema);
export default linkMap;
