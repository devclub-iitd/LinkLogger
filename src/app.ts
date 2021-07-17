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
  link.save();

  const query = {username: userData.username, email: userData.email};
  const update = {$addToSet: {links: link}};

  // Make Mongoose use `findOneAndUpdate()`. Note that this option is `true`
  // by default, you need to set it to false.
  mongoose.set('useFindAndModify', false);
  User.findOneAndUpdate(query, update, {upsert: true}, (err: any, doc: any) => {
    if (err) return res.send(err);
    console.log(doc);
    return res.send('Succesfully saved.');
  });
});

app.get('/redirect_to/:short_link', (req, res) => {
  const short_link = req.params.short_link;
  linkMap.findOne({short_link: short_link}).then((result: typeof linkMap) => {
    console.log(result);
    const original_link = result.original_link;
    const str = 'https://www.' + original_link;
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
