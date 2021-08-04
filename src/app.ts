import * as express from 'express';
import path = require('path');
import linkMap from './models/link';
import User from './models/user';
import linkData from './models/link_data';
import auth from './middleware/auth';
import {Request, Response} from 'express-serve-static-core';
import {isAnyArrayBuffer} from 'util/types';
const cookieParser = require('cookie-parser');

// Create Express server.
const app = express();
const mongoose = require('mongoose');

const useragent = require('useragent');
useragent(true);

const ip2loc = require('ip2location-nodejs');
ip2loc.IP2Location_init(path.join(__dirname, '../IP_DATA.BIN'));

const dbURI =
  'mongodb+srv://test_user:linklogging1234@linklogging.ijmqm.mongodb.net/link_logging?retryWrites=true&w=majority';
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  })
  .then((result: string) => {
    console.log('Connected to db');
  })
  .catch((error: string) => {
    console.log(error);
  });

// Express configuration
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, '../../views'));
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/', auth, (req, res) => {
  console.log(res.locals.user);
  res.send('Link Logger is Active!');
});

app.get('/link_generator', (req, res) => {
  res.render('link_generator');
});

app.post('/link_generator', auth, (req, res) => {
  const userData = res.locals.user;
  const original_link = req.body.original_link;
  const short_link = req.body.short_link;
  //have to add user id to users array in link also
  const link = new linkMap({
    short_link: short_link,
    original_link: original_link,
  });
  link
    .save()
    .then((link: any) => {
      const query = {username: userData.username, email: userData.email};
      const update = {$addToSet: {links: link}};
      // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
      // by default, you need to set it to false.
      mongoose.set('useFindAndModify', false);
      User.findOneAndUpdate(
        query,
        update,
        {upsert: true},
        (err: any, doc: any) => {
          if (err) return res.send(err);
          return res.send('Succesfully saved for ' + doc.username + '.');
        }
      );
    })
    .catch((error: any) => {
      res.send(error.message);
    });
});

app.get('/profile', auth, (req, res) => {
  try {
    const user = res.locals.user;
    User.findOne({email: user.email}).then(async (result: typeof User) => {
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

app.post('/profile/editLink', auth, (req, res) => {
  const linkObj = req.body.linkObj;
  //pass link[i] from frontend as linkObj
  const filter = {id: linkObj.id};
  const update = {
    short_link: req.body.short_link,
    original_link: req.body.original_link,
    expiry_date: req.body.expiry_date,
  };
  linkMap.findOneAndUpdate(filter, update);
});

app.post('/profile/deleteLink', auth, (req, res) => {
  const linkObj = req.body.linkObj;
  //pass link[i] from frontend as linkObj
  linkMap.findByIdAndDelete(linkObj.id);
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

app.get('/redirect_to/:short_link', auth, (req, res) => {
  const short_link = req.params.short_link;
  linkMap
    .findOne({short_link: short_link})
    .then((result: typeof linkMap) => {
      if (!result) {
        throw new Error('Link not found');
      }
      log_user_data(req, res, result);
      const original_link = result.original_link;
      res.status(301).redirect(original_link);
      res.end();
    })
    .catch((err: Error) => {
      res.end('Link not found');
    });
});

app.get('/analytics/:short_link', auth, async (req, res) => {
  try {
    const countOccurrences = (arr: Array<any>) => {
      return arr.reduce(
        (prev: any, curr: any) => ((prev[curr] = ++prev[curr] || 1), prev),
        {}
      );
    };
    const coordinates: Number[][] = [];
    const linkTime: String[] = [];
    const linkOS: String[] = [];
    const linkBrowser: String[] = [];
    const user = res.locals.user;
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
          lHour = lData.createdAt.toString();
          linkHour = lHour.substring(0, 19) + ':00:00' + lHour.substring(24);
          lBrowser = lData.browser.toString();
          lOS = lData.operating_system.toString();
          linkTime.push(linkHour);
          linkBrowser.push(lBrowser.substring(0, lBrowser.indexOf(' ')));
          linkOS.push(lOS.substring(0, lOS.indexOf(' ')));
        });
        res.locals.coordinates = coordinates;
        res.locals.linkTime = countOccurrences(linkTime);
        res.locals.linkBrowser = countOccurrences(linkBrowser);
        res.locals.linkOS = countOccurrences(linkOS);
        console.log(results);
        return res.end(JSON.stringify(results));
      });
  } catch (err: any) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.get('/map/:short_link', auth, async (req, res) => {
  res.locals.short_link = req.params.short_link;
  // countOccurences counts the frequency of each element and returns a json object with these pairs
  const countOccurrences = (arr: Array<any>) => {
    return arr.reduce(
      (prev: any, curr: any) => ((prev[curr] = ++prev[curr] || 1), prev),
      {}
    );
  };
  const coordinates: Number[][] = [];
  const linkTime: String[] = [];
  const linkOS: String[] = [];
  const linkBrowser: String[] = [];
  try {
    const user = res.locals.user;
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
        console.log(results);
        // return res.end(JSON.stringify(results));
        let linkHour, lBrowser, lOS, lHour;
        results.forEach(lData => {
          coordinates.push(lData.coordinates);
          lHour = lData.createdAt.toString();
          linkHour = lHour.substring(0, 19) + '00:00' + lHour.substring(24);
          lBrowser = lData.browser.toString();
          lOS = lData.operating_system.toString();
          linkTime.push(linkHour);
          linkBrowser.push(lBrowser.substring(0, lBrowser.indexOf(' ')));
          linkOS.push(lOS.substring(0, lOS.indexOf(' ')));
        });
        res.locals.coordinates = coordinates;
        res.locals.linkTime = countOccurrences(linkTime);
        res.locals.linkBrowser = countOccurrences(linkBrowser);
        res.locals.linkOS = countOccurrences(linkOS);
        res.render('map');
      });
  } catch (err: any) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.set('view engine', 'ejs');

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
