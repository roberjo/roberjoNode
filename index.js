var express = require('express')
var app = express()
var path = require('path'); 

app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
})

app.listen(3000, function () {
  console.log('Magic is happening on port 3000!')
})
