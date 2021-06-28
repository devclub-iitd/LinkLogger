import * as express from 'express';

// Create Express server.
const app = express();

// Express configuration
app.set('port', process.env.PORT || 5000);

app.get('/', (req, res) => {
  res.send('Link Logger is Active!');
});

const server = app.listen(app.get('port'), () => {
  console.log(`App is Running at http://localhost:${app.get('port')}`);
  console.log('Press CTRL-C to stop\n');
});

export default server;
