import * as express from 'express';
import path = require('path');
import linktreeMap from './models/linktree';

// Create Express server.
const app = express();
const mongoose = require('mongoose');

const dbURI =
  'mongodb+srv://test_user:linklogging1234@linklogging.ijmqm.mongodb.net/linktree?retryWrites=true&w=majority';
// mongodb://localhost/LinkTree --> use this for local db testing instead of dbURI
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

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.send('Link Logger is Active!');
});

app.get('/LinkTree', (req, res) => {
  res.render('LinkTree', {
    title: 'LinkTree',
    head: 'DevClub',
    links: [
      {name: 'Website', url: 'https://devclub.in/'},
      {name: 'GitHub', url: 'https://github.com/devclub-iitd/'},
      {
        name: 'Recruitment',
        url: 'https://drive.google.com/file/d/1HsUoeqMsSgESCTzvhPw9BpPWtIHfpGv6/view',
      },
    ],
  });
});

app.get('/LinkTree/Create', (req, res) => {
  res.render('LinkTreeCreate');
});

app.post('/LinkTree/Create', (req, res) => {
  const title = req.body.title;
  const link_title = req.body.link_title;
  const original_link = req.body.original_link;
  const link = {link_title: link_title, original_link: original_link};
  const linktree = new linktreeMap({
    title: title,
    links: link,
  });
  linktree.save();
  res.status(202).redirect('/LinkTree');
  res.end();
});

app.set('view engine', 'ejs');

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
