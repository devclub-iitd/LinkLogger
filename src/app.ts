import * as express from 'express';
import path = require('path');
import linkMap from './models/link';
import User from './models/user';
import linkData from './models/link_data';
import linktreeMap from './models/linktree';
import auth from './middleware/auth';
import {Request, Response} from 'express-serve-static-core';
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
  const user = res.locals.user;
  console.log('user is ' + user);
  const linkObj = req.body.linkObj;
  console.log(linkObj);
  //pass link[i] from frontend as linkObj
  linkMap.findByIdAndDelete(linkObj, (err: Error, docs: typeof linkMap) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send('Successfully deleted ' + docs);
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

app.post('/log_linktree', auth, async (req, res) => {
  console.log('in log_linktree');
  let link: typeof linkMap;
  let link_id: String;
  link_id = req.body.link_id;
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
  const coordinates: Number[][] = [];
  const linkTime: string[] = [];
  const linkOS: String[] = [];
  const linkBrowser: String[] = [];
  let startDate = new Date(),
    endDate = new Date();
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
        let AtleastOne: Boolean = true;
        results.forEach(lData => {
          coordinates.push(lData.coordinates);
          if (AtleastOne) startDate = lData.createdAt;
          AtleastOne = false;
          endDate = lData.createdAt;
          lHour = JSON.stringify(lData.createdAt);
          linkHour = lHour.substring(1, 15) + '00:00.000Z';
          lBrowser = lData.browser.toString();
          lOS = lData.operating_system.toString();
          linkTime.push(linkHour);
          linkBrowser.push(trimString(lBrowser));
          linkOS.push(trimString(lOS));
        });
        startDate.setMinutes(30, 0, 0);
        endDate.setMinutes(30, 0, 0);
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setTime(d.getTime() + 60 * 60 * 1000)
        ) {
          linkTime.push(JSON.stringify(new Date(d)).substring(1, 25));
        }
        linkTime.sort();
        res.locals.coordinates = coordinates;
        res.locals.linkTime = countOccurrences(linkTime);
        res.locals.linkBrowser = countOccurrences(linkBrowser);
        res.locals.linkOS = countOccurrences(linkOS);
        console.log(results);
        res.render('analytics');
      });
  } catch (err: any) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.get('/LinkTree', auth, async (req, res) => {
  const links: {name: string; url: string}[] = [];
  await User.findOne({email: res.locals.user.email})
    .populate('linktrees')
    .exec((err: Error, result: typeof User) => {
      console.log(result);
      result.linktrees.forEach((linktree: typeof linktreeMap) => {
        const link = {
          name: linktree.title,
          url: `http://localhost:${app.get('port')}/LinkTree/${linktree.title}`,
        };
        console.log(link);
        links.push(link);
      });
      console.log(links);
      res.render('LinkTree', {
        title: 'LinkTree',
        head: `Linktrees for ${res.locals.user.username}`,
        links: links,
      });
    });
});

app.get('/LinkTree/Create', (req, res) => {
  res.render('LinkTreeCreate');
});

app.post('/LinkTree/Create', auth, async (req, res) => {
  try {
    const title = req.body.title;
    const links = [];
    const userData = res.locals.user;
    const count = req.body.numberOfLinks;
    console.log('Count = ' + count);
    for (let index = 1; index <= count; index++) {
      try {
        const link_title = eval('req.body.link_title' + index);
        const original_link = eval('req.body.original_link' + index);
        // const link = {link_title: link_title, original_link: original_link};
        const link = new linkMap({
          short_link: link_title,
          original_link: original_link,
          is_in_tree: true,
        });
        link.save();
        links.push(link);
      } catch (error) {
        console.log('Problem sending link ' + index + ' : ' + error);
      }
    }
    const linktree = new linktreeMap({
      title: title,
      links: links,
    });
    await linktree.save().then((linktree: any) => {
      const query = {username: userData.username, email: userData.email};
      const update = {$addToSet: {linktrees: linktree}};
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
    });
  } catch (err) {
    console.log('Error:  ' + err);
  }
  // res.status(202).redirect('/LinkTree');
  // res.end();
});

app.get('/LinkTree/:link_tree', auth, async (req, res) => {
  res.locals.short_link = req.params.short_link;
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

app.get('/public_tree/:linktree_title', async (req, res) => {
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
});

app.set('view engine', 'ejs');

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
