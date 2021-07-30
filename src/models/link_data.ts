const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkDataSchema = new Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'linkMap',
      required: true,
    },
    operating_system: {
      type: String,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    ip: {
      type: String,
    },
    referrer: {
      type: String,
    },
    user_data: {
      type: Object,
    },
    city: {
      type: String,
    },
  },
  {timestamps: true}
);

const linkData = mongoose.model('linkData', linkDataSchema);
export default linkData;
