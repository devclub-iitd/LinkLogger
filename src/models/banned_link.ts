const mongoose = require('mongoose');
import linkMap from './link';
const Schema = mongoose.Schema;
const banned_linkSchema = new Schema(
  {
    short_link: {
      type: linkMap,
    },
    linkTree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'linktreeMap',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {timestamps: true}
);

const banned_linkMap = mongoose.model('banned_linkMap', banned_linkSchema);
export default banned_linkMap;
