const mongoose = require('mongoose');
const Schema = mongoose.Schema;
import isMobilePhone from 'validator';
import isEmail from 'validator';

// export interface IUser extends mongoose.Document {
//     email: string;
//     name: string;
//     entryNumber: string;
//     hostel: string;
//     gender: string;
//     joinYear: Date;
//     gradYear: Date;
//     birthDate: Date;
//     mobileNumber: Date;
//     hometown: string;
//     interests: string;
//     specialization?: string;
//     intro: string;
//     displayOnWebsite: boolean;
//     links?: {[key: string]: string };
//     createdAt?: Date;
//     updatedAt?: Date;
// };

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      validate: [isEmail, 'invalid email'],
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      //required: true,
      trim: true,
    },
    entry_no: {
      type: String,
      // required: true,
      uppercase: true,
      // unique: true,
      minlength: 11,
      maxlength: 11,
      trim: true,
      index: true,
      default: 'XXXXXXXXXXX',
    },
    hostel: {
      type: String,
      // required: true,
      uppercase: true,
      enum: [
        'SATPURA',
        'GIRNAR',
        'UDAIGIRI',
        'ZANSKAR',
        'ARAVALI',
        'KUMAON',
        'VINDHYACHAL',
        'JWALAMUKHI',
        'NILGIRI',
        'KARAKORAM',
        'SHIVALIK',
        'KAILASH',
        'HIMADRI',
      ],
      trim: true,
      default: 'SATPURA',
    },
    gender: {
      type: String,
      // required: true,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    join_year: {
      type: Date,
      // required: true,
      default: '01/01/2015',
    },
    grad_year: {
      type: Date,
      required: true,
      default: '01/01/2019',
    },
    birth_date: {
      type: Date,
      // required: true,
      default: '01/01/1997',
    },
    mobile_number: {
      type: String,
      validate: [isMobilePhone, 'invalid phone number'],
      default: '+919999999999',
    },
    hometown: {
      type: String,
      // required: true,
      default: '',
    },
    interests: {
      type: String,
      // required: true,
      default: '',
    },
    specialization: {
      type: String,
      // required: true,
      default: '',
    },
    intro: {
      type: String,
      // required: true,
      default: '',
    },
    category: {
      type: String,
      required: true,
    },
    display_on_website: {
      type: Boolean,
      // required: true,
      default: false,
    },
    url: {
      type: Map,
      of: String,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true
    },
    privelege_level: {
      type: String,
      enum: ['Admin', 'Approved_User', 'Unapproved_User'],
      required: true,
      default: 'User',
    },
    casi_email: {
      type: String,
      unique: false,
      validate: [isEmail, 'invalid email'],
      trim: true,
    },
  },
  {timestamps: true}
);

const User = mongoose.model('User', userSchema);
export default User;
