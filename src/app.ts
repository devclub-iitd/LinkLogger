import * as express from 'express';
import path = require('path')

// Create Express server.
const app = express();

// Express configuration
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, '../../views'));

app.get('/', (req, res) => {
  res.send('Link Logger is Active!');
});

app.get('/LinkTree', (req, res) => {
  res.render('LinkTree', {
    title : 'LinkTree', 
    head: 'DevClub',
    links: [
      {name:'Website', url: 'https://devclub.in/'}, 
      {name:'GitHub', url:'https://github.com/devclub-iitd/'},
      {name:'Recruitment', url:'https://drive.google.com/file/d/1HsUoeqMsSgESCTzvhPw9BpPWtIHfpGv6/view'},
    ]
  });
});

app.set('view engine', 'ejs');

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
