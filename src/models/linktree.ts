const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const linktreeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      // unique: true,
    },
    links: [
      {
        link_title: {
          type: String,
          required: true,
        },
        short_link: {
          type: String,
        },
        original_link: {
          type: String,
          required: true,
        },
        active: {
          type: Boolean,
          default: true,
          required: true,
        },
        expiry: {
          type: Date,
        },
      },
    ],
  },
  {timestamps: true}
);

const linktreeMap = mongoose.model('LinkTree', linktreeSchema);
export default linktreeMap;
