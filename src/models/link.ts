const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linkSchema = new Schema(
  {
    // users: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //   }
    // ],
    short_link: {
      type: String,
      required: true,
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
  },
  {timestamps: true}
);

const linkMap = mongoose.model('linkMap', linkSchema);
export default linkMap;
