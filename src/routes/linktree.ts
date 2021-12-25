const express = require('express');
const router = express.Router();
import linkMap from '../models/link';
import User from '../models/user';
import auth from '../middleware/auth';
import linktreeMap from '../models/linktree';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');

router.get('/', auth, async (req: Request, res: Response) => {
  const links: {name: string; url: string}[] = [];
  await User.findOne({email: res.locals.user.email})
    .populate('linktrees')
    .exec((err: Error, result: typeof User) => {
      console.log(result);
      result.linktrees.forEach((linktree: typeof linktreeMap) => {
        const link = {
          name: linktree.title,
          url: `http://localhost:${req.app.get('port')}/LinkTree/${
            linktree.title
          }`,
        };
        console.log('link' + link);
        links.push(link);
      });
      console.log('links' + links);
      res.render('LinkTree', {
        title: 'LinkTree',
        head: `Linktrees for ${res.locals.user.username}`,
        links: links,
        user: res.locals.user,
      });
    });
});

router.get('/Create', auth, (req: Request, res: Response) => {
  res.render('LinkTreeCreate', {user: res.locals.user});
});

router.post('/Create', auth, async (req: Request, res: Response) => {
  try {
    const title = req.body.title;
    const links: typeof linkMap[] = [];
    const userData = res.locals.user;
    const count = req.body.numberOfLinks;
    console.log('Count = ' + count);
    for (let index = 1; index <= count; index++) {
      const link_title = eval('req.body.link_title' + index);
      const original_link = eval('req.body.original_link' + index);
      // const link = {link_title: link_title, original_link: original_link};
      const link = new linkMap({
        title: link_title,
        original_link: original_link,
        is_in_tree: true,
      });
      console.log('link: ', JSON.stringify(link));
      await link
        .save()
        .then((link: typeof linkMap) => {
          links.push(link);
        })
        .catch((err: Error) =>
          console.log('err while saving: ' + index, err.message)
        );
    }
    const linktree = new linktreeMap({
      title: title,
      links: links,
    });
    await linktree
      .save()
      .then((linktree: typeof linktreeMap) => {
        const query = {username: userData.username, email: userData.email};
        const update = {$addToSet: {linktrees: linktree}};
        mongoose.set('useFindAndModify', false);
        User.findOneAndUpdate(
          query,
          update,
          {upsert: true},
          (err: Error, doc: typeof User) => {
            if (err) return res.send(err);
            console.log('Succesfully saved for ' + doc.username + '.');
            return res.status(202).redirect(`/LinkTree/${title}`);
          }
        );
      })
      .catch((err: Error) => res.send(err.message));
  } catch (err) {
    console.log('Error:  ' + err);
  }
});

router.get('/:link_tree', auth, async (req: Request, res: Response) => {
  // res.locals.short_link = req.params.short_link;
  try {
    const user = res.locals.user;
    console.log(req.params.link_tree);
    let linktree: typeof linktreeMap;
    let target_id: string;
    let links_id;
    let links: typeof linkMap[];
    target_id = '';
    await linktreeMap
      .findOne({title: req.params.link_tree})
      .then(async (result: typeof linktreeMap) => {
        if (result === null) {
          throw new Error('No linktree found');
        }
        console.log(result);
        linktree = result;
        links_id = linktree.links;
        links = new Array(links_id.length);
        for (let i = 0; i < links_id.length; i++) {
          links[i] = await linkMap.findById(links_id[i]);
        }
        console.log(links);
      });
    await User.findOne({email: res.locals.user.email}).then(
      (result: typeof User) => {
        if (result === null) {
          throw new Error('No user found');
        }
        const linktrees_id = result.linktrees;
        for (let i = 0; i < linktrees_id.length; i++) {
          if (linktrees_id[i].toString() === linktree._id.toString()) {
            target_id = linktree._id;
            break;
          }
        }
        if (target_id === '') {
          throw new Error('You are not authorized to view this linktree');
        }
        res.render('tree', {links: links, user: user, linktree: linktree});
      }
    );
  } catch (err: any) {
    console.log(err.message);
    res.send(err.message);
  }
});

router.get('/:link_tree/delete', auth, async (req: Request, res: Response) => {
  //check if linktree belongs to this user => delete links, linktree and linktree id from user object
  try {
    console.log('deleting linktree');
    const user = res.locals.user;
    let linktree_id: string;
    let linktrees_id;
    linktree_id = '';
    let linktree: typeof linktreeMap;
    let user_check = 0;
    let links_id;
    //check if linktree belongs to this user
    await User.findOne({email: user.email}).then(
      async (result: typeof User) => {
        //console.log(result);
        if (result === null) {
          throw new Error('No user found');
        }
        linktrees_id = result.linktrees;
        console.log(linktrees_id);
        for (let i = 0; i < linktrees_id.length; i++) {
          linktree = await linktreeMap
            .findById(mongoose.Types.ObjectId(linktrees_id[i].toString()))
            .exec();
          if (!(linktree === null)) {
            if (linktree.title === req.params.link_tree) {
              user_check = 1;
              console.log(linktree);
              linktree_id = linktree._id;
              break;
            }
          }
        }
        if (user_check === 0) {
          throw new Error('Unauthorized access');
        }
      }
    );
    console.log('linktree: ' + linktree);
    // eslint-disable-next-line prefer-const
    links_id = linktree.links;
    for (let i = 0; i < links_id.length; i++) {
      await linkMap.findOneAndDelete({
        _id: mongoose.Types.ObjectId(links_id[i].toString()),
      });
    }
    await linktreeMap.findOneAndDelete({
      _id: mongoose.Types.ObjectId(linktree_id.toString()),
    });
    const user_query = {username: user.username, email: user.email};
    const update = {$pull: {linktrees: linktree_id}};
    mongoose.set('useFindAndModify', false);
    User.findOneAndUpdate(
      user_query,
      update,
      (err: Error, doc: typeof User) => {
        if (err) return res.send(err);
        return res.send('Successfully deleted linktree');
      }
    );
  } catch (err) {
    console.log(err);
  }
});

router.post('/:linktree/deleteLink', auth, (req: Request, res: Response) => {
  const user = res.locals.user;
  console.log('user is ' + user);
  const linktree_title = req.params.linktree;
  console.log('linktree is ' + linktree_title);
  const linkObj = req.body.linkObj;
  console.log('linkObj: ' + linkObj);
  //pass link[i] from frontend as linkObj
  linkMap.findByIdAndDelete(linkObj, (err: Error, docs: typeof linkMap) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Successfully deleted ' + docs.title);
    }
  });
  const filter = {title: linktree_title};
  const update = {$pull: {links: linkObj}};
  linktreeMap.findOneAndUpdate(
    filter,
    update,
    (err: Error, docs: typeof User) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Edited for linktree ' + docs.title);
      }
    }
  );
});

router.post('/:linktree/add_link', auth, (req: Request, res: Response) => {
  const linktree_title = req.params.linktree;
  const original_link = req.body.original_link;
  const short_link = req.body.short_link;
  //have to add user id to users array in link also
  const link = new linkMap({
    title: short_link,
    original_link: original_link,
    is_in_tree: true,
  });
  link
    .save()
    .then((link: typeof linkMap) => {
      const query = {title: linktree_title};
      const update = {$addToSet: {links: link}};
      // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
      // by default, you need to set it to false.
      mongoose.set('useFindAndModify', false);
      linktreeMap.findOneAndUpdate(
        query,
        update,
        (err: Error, doc: typeof linktreeMap) => {
          if (err) return res.send(err.message);
          console.log('Updated linktree ' + doc.title);
          res.status(200).redirect('/LinkTree/' + linktree_title);
        }
      );
    })
    .catch((error: Error) => {
      res.send(error.message);
    });
});

module.exports = router;
