"use strict";

var express = require('express');

var app = express();

app.use('/static', express.static(__dirname + '/public'));

/** SET UP THE VIEW ENGINE */
app.set('view engine', 'pug');
app.set('views', __dirname + '/public/views')

app.get('/', function (req, res) {
	res.render('index');
});

app.listen(3000, function(){
	console.log("The nodemon frontend server is running at port 3000");
});