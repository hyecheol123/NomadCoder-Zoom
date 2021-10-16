import express from 'express';

const app = express();

// Template engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views/');

// Static files are served at /public path
app.use('/public', express.static(__dirname + '/public'));

// Landing page
app.get('/', (req, res) => {
  res.render('home');
});

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
