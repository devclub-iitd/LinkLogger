const express = require('express');
const router = express.Router();
import linkMap from '../models/link';
import User from '../models/user';
import auth from '../middleware/auth';
import linkData from '../models/link_data';
import linktreeMap from '../models/linktree';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');

router.get('/:short_link', auth, async (req: Request, res: Response) => {
  res.locals.short_link = req.params.short_link;
  // trimString removes everything after a space in a string
  function trimString(str: String) {
    if (str.indexOf(' ') === -1) return str;
    else return str.substring(0, str.indexOf(' '));
  }
  // countOccurences counts the frequency of each element and returns a json object with element-count pairs
  const countOccurrences = (arr: Array<any>) => {
    return arr.reduce(
      (prev: any, curr: any) => ((prev[curr] = ++prev[curr] || 1), prev),
      {}
    );
  };
  function addHoursToDate(date: Date, hours: number): Date {
    return new Date(new Date(date).setHours(date.getHours() + hours));
  }
  const coordinates: Number[][] = [];
  const linkTime: string[] = [];
  const linkOS: String[] = [];
  const linkBrowser: String[] = [];
  try {
    let link: typeof linkMap;
    let target_id: string;
    target_id = '';
    await linkMap
      .findOne({short_link: req.params.short_link})
      .then((result: typeof linkMap) => {
        if (result === null) {
          throw new Error('No link found');
        }
        console.log(result);
        link = result;
      });
    await User.findOne({email: res.locals.user.email}).then(
      (result: typeof User) => {
        if (result === null) {
          throw new Error('No user found');
        }
        const links_id = result.links;
        for (let i = 0; i < links_id.length; i++) {
          if (links_id[i].toString() === link._id.toString()) {
            target_id = link._id;
            break;
          }
        }
        if (target_id === '') {
          throw new Error('You are not authorized to view this link');
        }
      }
    );
    await linkData
      .find({link: target_id})
      .lean()
      .exec((err: Error, results: typeof linkData[]) => {
        let linkHour, lBrowser, lOS, lHour;
        results.forEach(lData => {
          coordinates.push(lData.coordinates);
          lHour = JSON.stringify(lData.createdAt);
          linkHour = lHour.substring(1, 15) + '00:00.000Z';
          lBrowser = lData.browser.toString();
          lOS = lData.operating_system.toString();
          linkTime.push(linkHour);
          linkBrowser.push(trimString(lBrowser));
          linkOS.push(trimString(lOS));
        });
        linkTime.sort();
        const linkTimeCount = countOccurrences(linkTime);
        const timeKeys = Object.keys(linkTimeCount);
        timeKeys.forEach(timeKey => {
          const nextHr = JSON.stringify(
            addHoursToDate(new Date(timeKey), 1)
          ).substring(1, 25);
          if (!timeKeys.includes(nextHr)) {
            linkTimeCount[nextHr] = 0;
          }
          const prevHr = JSON.stringify(
            addHoursToDate(new Date(timeKey), -1)
          ).substring(1, 25);
          if (!timeKeys.includes(prevHr)) {
            linkTimeCount[prevHr] = 0;
          }
        });
        const keysSorted = Object.keys(linkTimeCount).sort();
        const serializedTime: {[x: string]: number} = {};
        keysSorted.forEach(timeKey => {
          serializedTime[timeKey] = linkTimeCount[timeKey];
        });
        res.locals.coordinates = coordinates;
        res.locals.linkTime = serializedTime;
        res.locals.linkBrowser = countOccurrences(linkBrowser);
        res.locals.linkOS = countOccurrences(linkOS);
        res.render('analytics', {user: res.locals.user});
      });
  } catch (err: any) {
    console.log(err.message);
    res.send(err.message);
  }
});

router.get(
  '/:linktree/:short_link',
  auth,
  async (req: Request, res: Response) => {
    // res.locals.short_link = req.params.short_link;
    // trimString removes everything after a space in a string
    function trimString(str: String) {
      if (str.indexOf(' ') === -1) return str;
      else return str.substring(0, str.indexOf(' '));
    }
    // countOccurences counts the frequency of each element and returns a json object with element-count pairs
    const countOccurrences = (arr: Array<any>) => {
      return arr.reduce(
        (prev: any, curr: any) => ((prev[curr] = ++prev[curr] || 1), prev),
        {}
      );
    };
    function addHoursToDate(date: Date, hours: number): Date {
      return new Date(new Date(date).setHours(date.getHours() + hours));
    }
    const coordinates: Number[][] = [];
    const linkTime: string[] = [];
    const linkOS: String[] = [];
    const linkBrowser: String[] = [];
    let linktrees_id;
    let linktree: typeof linktreeMap;
    let user_check = 0;
    try {
      let link: typeof linkMap;
      let target_id: string;
      target_id = '';
      await linkMap
        .findOne({_id: req.params.short_link})
        .then((result: typeof linkMap) => {
          if (result === null) {
            throw new Error('No link found');
          }
          console.log(result);
          link = result;
          res.locals.short_link = link.title;
        });
      await linktreeMap
        .findOne({title: req.params.linktree})
        .then((result: typeof User) => {
          if (result === null) {
            throw new Error('No linktree found');
          }
          const links_id = result.links;
          for (let i = 0; i < links_id.length; i++) {
            if (links_id[i].toString() === link._id.toString()) {
              target_id = link._id;
              break;
            }
          }
          if (target_id === '') {
            throw new Error('You are not authorized to view this link');
          }
        });
      await User.findOne({email: res.locals.user.email}).then(
        async (result: typeof User) => {
          //console.log(result);
          if (result === null) {
            throw new Error('No user found');
          }
          linktrees_id = result.linktrees;
          console.log('linktrees_id: ' + linktrees_id);
          for (let i = 0; i < linktrees_id.length; i++) {
            linktree = await linktreeMap
              .findById(mongoose.Types.ObjectId(linktrees_id[i].toString()))
              .exec();
            if (!(linktree === null)) {
              if (linktree.title === req.params.linktree) {
                user_check = 1;
                console.log(linktree);
                break;
              }
            }
          }
          if (user_check === 0) {
            throw new Error('Unauthorized access');
          }
        }
      );
      await linkData
        .find({link: target_id})
        .lean()
        .exec((err: Error, results: typeof linkData[]) => {
          let linkHour, lBrowser, lOS, lHour;
          results.forEach(lData => {
            coordinates.push(lData.coordinates);
            lHour = JSON.stringify(lData.createdAt);
            linkHour = lHour.substring(1, 15) + '00:00.000Z';
            lBrowser = lData.browser.toString();
            lOS = lData.operating_system.toString();
            linkTime.push(linkHour);
            linkBrowser.push(trimString(lBrowser));
            linkOS.push(trimString(lOS));
          });
          linkTime.sort();
          const linkTimeCount = countOccurrences(linkTime);
          const timeKeys = Object.keys(linkTimeCount);
          timeKeys.forEach(timeKey => {
            const nextHr = JSON.stringify(
              addHoursToDate(new Date(timeKey), 1)
            ).substring(1, 25);
            if (!timeKeys.includes(nextHr)) {
              linkTimeCount[nextHr] = 0;
            }
            const prevHr = JSON.stringify(
              addHoursToDate(new Date(timeKey), -1)
            ).substring(1, 25);
            if (!timeKeys.includes(prevHr)) {
              linkTimeCount[prevHr] = 0;
            }
          });
          const keysSorted = Object.keys(linkTimeCount).sort();
          const serializedTime: {[x: string]: number} = {};
          keysSorted.forEach(timeKey => {
            serializedTime[timeKey] = linkTimeCount[timeKey];
          });
          res.locals.coordinates = coordinates;
          res.locals.linkTime = serializedTime;
          res.locals.linkBrowser = countOccurrences(linkBrowser);
          res.locals.linkOS = countOccurrences(linkOS);
          res.render('analytics', {user: res.locals.user});
        });
    } catch (err: any) {
      console.log(err.message);
      res.send(err.message);
    }
  }
);

module.exports = router;
