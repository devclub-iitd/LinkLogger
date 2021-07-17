const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linktreeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      // unique: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    links: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'linkMap',
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {timestamps: true}
);

const linktreeMap = mongoose.model('linktreeMap', linktreeSchema);
export default linktreeMap;
