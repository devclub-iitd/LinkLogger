const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
    },
    // firstname: {
    //   type: String,
    // },
    // lastname: {
    //   type: String,
    // },
    username: {
      type: String,
      unique: true,
      required: true,
    },
    linktrees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'linktreeMap',
      },
    ],
    links: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'linkMap',
      },
    ],
  },
  {timestamps: true}
);

const User = mongoose.model('User', userSchema);
export default User;
