import linkMap from '../models/link';
import User from '../models/user';
import auth from '../middleware/auth';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');

const express = require('express');
const router = express.Router();

router.get('/', auth, (req: Request, res: Response) => {
  res.render('link_generator', {user: res.locals.user});
});

router.post('/', auth, (req: Request, res: Response) => {
  const user = res.locals.user;
  const original_link = req.body.original_link;
  const short_link = req.body.short_link;
  //have to add user id to users array in link also
  const link = new linkMap({
    short_link: short_link,
    original_link: original_link,
  });
  link
    .save()
    .then((link: typeof linkMap) => {
      const query = {username: user.username, email: user.email};
      const update = {$addToSet: {links: link}};
      // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
      // by default, you need to set it to false.
      mongoose.set('useFindAndModify', false);
      User.findOneAndUpdate(query, update, (err: Error, doc: typeof User) => {
        if (err) {
          console.log('err: ' + err);
          res.send(err.message);
        } else {
          console.log('doc: ' + doc);
          res.status(200).send('Link added for ' + user.username);
        }
      });
    })
    .catch((error: Error) => {
      res.send(error.message);
    });
});

module.exports = router;
