var express = require('express');
app = express();
config = require('./server/configure'); 
mongoose = require('mongoose');

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app = config(app);
mongoose.connect('mongodb://localhost:27017/imgshared');
mongoose.connection.on('open', function() {
    console.log('mongoose connected');
});


app.listen(app.get('port'), function() {
    console.log('server running');
});