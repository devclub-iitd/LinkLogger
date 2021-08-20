const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const reportSchema = new Schema(
  {
    link: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {timestamps: true}
);

const reportMap = mongoose.model('reportMap', reportSchema);
export default reportMap;
