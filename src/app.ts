import * as express from 'express';
import path = require('path');
import linkMap from './models/link';

// Create Express server.
const app = express();
const mongoose = require('mongoose');

var dbURI = "mongodb+srv://test_user:linklogging1234@linklogging.ijmqm.mongodb.net/link_logging?retryWrites=true&w=majority";
mongoose.connect(dbURI,{ useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
  .then(function(result:string){
    console.log("Connected to db");
  }).catch(function(error:string){
    console.log(error);
  });

// Express configuration
app.set('port', process.env.PORT || 5000);
app.set('views',path.join(__dirname,"../../views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Link Logger is Active!');
});

app.get('/link_generator',function(req,res){
  res.render('link_generator');
});

app.post('/link_generator',function(req,res){
  const original_link = req.body.original_link;
  const short_link = req.body.short_link;
  const link = new linkMap({
    short_link:short_link,
    original_link:original_link
  });
  link.save();
});

app.get('/redirect_to/:short_link',function(req,res){
  const short_link = req.params.short_link;
  linkMap.findOne({"short_link":short_link})
    .then((result:typeof linkMap)=>{
      console.log(result);
      const original_link = result.original_link;
      const str = "https://www." + original_link;
      res.status(301).redirect(str);
      res.end();
    })
});

app.set("view engine", "ejs");

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
