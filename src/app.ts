import * as express from 'express';
import path = require('path');
import linkMap from './models/link';
import User from './models/user';
import auth from './middleware/auth';
const cookieParser = require('cookie-parser');

// Create Express server.
const app = express();
const mongoose = require('mongoose');

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
// Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
// by default, you need to set it to false.
mongoose.set('useFindAndModify', false);

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

  const link = new linkMap({
    short_link: short_link,
    original_link: original_link,
  });
  link
    .save()
    .then((link: typeof linkMap) => {
      const query = {username: userData.username, email: userData.email};
      const update = {$addToSet: {links: link}};
      User.findOneAndUpdate(
        query,
        update,
        {upsert: true},
        (err: Error, doc: typeof User) => {
          if (err) return res.send(err);
          return res.send('Succesfully saved for ' + doc.username + '.');
        }
      );
    })
    .catch((error: Error) => {
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
  console.log(linkObj);
  console.log(req.body.short_link);
  console.log(req.body.original_link);
  //pass link[i] from frontend as linkObj
  //pass new shortLink from form as short_link
  //pass new originalLink from form as original_link
  //pass new expiryDate from form as expiry_date
  const filter = {_id: linkObj};
  const update = {
    short_link: req.body.short_link,
    original_link: req.body.original_link,
    expiry_date: req.body.expiry_date,
  };
  linkMap.findOneAndUpdate(
    filter,
    update,
    {new: true},
    (err: Error, docs: typeof linkMap) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.send(docs);
      }
    }
  );
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

app.get('/redirect_to/:short_link', (req, res) => {
  const short_link = req.params.short_link;
  linkMap.findOne({short_link: short_link}).then((result: typeof linkMap) => {
    console.log(result);
    const original_link = result.original_link;
    const str = original_link;
    res.status(301).redirect(str);
    res.end();
  });
});

app.set('view engine', 'ejs');

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
