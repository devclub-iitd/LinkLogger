const express = require('express');
const router = express.Router();
import linkMap from '../models/link';
import User from '../models/user';
import auth from '../middleware/auth';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');

router.get('/', auth, (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    const query = {username: user.username, email: user.email};
    User.findOne(query).then(async (result: typeof User) => {
      const links_id = result.links;
      const links: typeof linkMap[] = new Array(links_id.length);
      for (let i = 0; i < links_id.length; i++) {
        links[i] = await linkMap.findById(links_id[i]);
      }
      res.render('profile', {links: links, user: user});
    });
  } catch (JsonWebTokenError) {
    res.render('<h1>Unauthorized</h1>');
  }
});

router.post('/editLink', auth, async (req: Request, res: Response) => {
  const linkObj = req.body.linkObj;
  //pass link[i] from frontend as linkObj
  const filter = {_id: linkObj};
  let update;
  // eslint-disable-next-line prefer-const
  if (req.body.title === null) {
    update = {
      short_link: req.body.short_link,
      original_link: req.body.original_link,
      expiry_date: req.body.expiry_date,
    };
  } else if (req.body.short_link === null) {
    update = {
      title: req.body.title,
      original_link: req.body.original_link,
      expiry_date: req.body.expiry_date,
    };
  }
  console.log('update: ' + JSON.stringify(update));
  // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
  // by default, you need to set it to false.
  mongoose.set('useFindAndModify', false);
  await linkMap
    .findOneAndUpdate(filter, update, {new: true})
    .then((doc: typeof linkMap, err: Error) => {
      if (err) console.log('err: ' + err);
      else {
        console.log('doc: ' + doc);
      }
    });
});

router.post('/deleteLink', auth, (req: Request, res: Response) => {
  const user = res.locals.user;
  console.log('user is ' + JSON.stringify(user));
  const linkObj = req.body.linkObj;
  console.log('linkObj' + linkObj);
  //pass link[i] from frontend as linkObj
  mongoose.set('useFindAndModify', false);
  linkMap.findByIdAndDelete(linkObj, (err: Error, docs: typeof linkMap) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).redirect('/profile');
      console.log('Successfully deleted ' + docs);
    }
  });
  const filter = {email: user.email};
  const update = {$pull: {links: linkObj}};
  User.findOneAndUpdate(filter, update, (err: Error, docs: typeof User) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Edited for user ' + docs.username);
    }
  });
});

module.exports = router;
