const express = require('express');
const router = express.Router();
import linkMap from '../models/link';
import linktreeMap from '../models/linktree';
import User from '../models/user';
import auth from '../middleware/auth';
import {Request, Response} from 'express-serve-static-core';
const mongoose = require('mongoose');
import linkData from '../models/link_data';
import path = require('path');

const useragent = require('useragent');
useragent(true);

const ip2loc = require('ip2location-nodejs');
ip2loc.IP2Location_init(path.join(__dirname, '../../IP_DATA.BIN'));

router.post('/log_linktree', async (req: Request, res: Response) => {
  console.log('in log_linktree');
  let link: typeof linkMap;
  let link_id: String;
  // eslint-disable-next-line prefer-const
  link_id = req.body.link_id;
  // eslint-disable-next-line prefer-const
  link = await linkMap.findById(link_id);
  log_user_data(req, res, link);
  res.json(link);
  res.end();
});

function log_user_data(req: Request, res: Response, result: typeof linkMap) {
  const user_agent_details = useragent.parse(req.headers['user-agent']);
  const os = user_agent_details.os.toString();
  const device = user_agent_details.device.toString();
  const browser = user_agent_details.toAgent();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(ip);
  const referrer = req.get('Referrer'); //equivalent to req.headers.referrer || req.headers.referer
  const user_data = res.locals.user;
  let city: String;
  let coordinates: Array<Number>;
  city = '';
  // eslint-disable-next-line prefer-const
  coordinates = [0, 0];
  try {
    const loc = ip2loc.IP2Location_get_all(ip);
    if (loc === null) {
      throw new Error('Unable to convert');
    } else {
      coordinates[0] = loc.latitude;
      coordinates[1] = loc.longitude;
      city = loc.city;
    }
  } catch (err) {
    console.log(err);
  }

  const link_data = new linkData({
    link: result._id,
    operating_system: os,
    device: device,
    browser: browser,
    ip: ip,
    coordinates: coordinates,
    city: city,
    referrer: referrer,
    user_data: user_data,
  });
  link_data.save();
}

router.get('/redirect_to/:short_link', auth, (req: Request, res: Response) => {
  const short_link = req.params.short_link;
  linkMap
    .findOne({short_link: short_link})
    .then((result: typeof linkMap) => {
      if (!result) {
        throw new Error('Link not found');
      }
      if (!result.is_in_tree) {
        log_user_data(req, res, result);
        const original_link = result.original_link;
        res.status(301).redirect(original_link);
        res.end();
      } else {
        res.status(404).send('Visit LinkTree');
      }
    })
    .catch((err: Error) => {
      console.log(err.message);
      res.end('Link not found');
    });
});

router.get(
  '/public_tree/:linktree_title',
  async (req: Request, res: Response) => {
    //fetch the linktree, display set of links, log user data on clicking a link
    let linktree: typeof linktreeMap;
    let links_id;
    let links: typeof linkMap[];
    await linktreeMap
      .findOne({title: req.params.linktree_title})
      .then(async (result: typeof linktreeMap) => {
        if (result === null) {
          throw new Error('No linktree found');
        }
        linktree = result;
        links_id = linktree.links;
        links = new Array(links_id.length);
        for (let i = 0; i < links_id.length; i++) {
          links[i] = await linkMap.findById(links_id[i]);
        }
        res.render('public_tree', {links: links, linktree: linktree});
      });
  }
);

module.exports = router;
