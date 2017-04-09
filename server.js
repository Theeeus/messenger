var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server,{ path: '/chat/socket.io'});
var bodyParser = require('body-parser');
var port = process.env.PORT || 3000;

app.use(express.static('./'));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine','pug');
app.set('views', __dirname + '/views');

app.get('/',function(req,res){
    res.render('index', { message : ''});
});

app.post('/enter',function(req,res){
    if (req.body.action === "create") {
        var count = 0;
        for (var i=0;i<rooms.length;i++) {
            if (rooms[i].name == req.body.room) { //room already exists
                count++;
            }
        }
        if (count > 0) {
            res.render('index', {message : 'the room you tried to create already exists'});
        } else {
            res.redirect('/chat?name=' + req.body.nickname + '&action=' + req.body.action + '&room=' + req.body.room);
        }
    } else if (req.body.action === "join") {
        var count = 0;
        for (var i=0;i<rooms.length;i++) {
            if (rooms[i].name == req.body.room) { //room already exists
                count++;
            }
        }
        if (count == 0) {
            res.render('index', {message : 'the room you tried to join doesn\'t exist'});
        } else {
            res.redirect('/chat?name=' + req.body.nickname + '&action=' + req.body.action + '&room=' + req.body.room);
        }
    }
})

app.get('/chat', function(req,res){
    res.render('chat',{ name : req.query.name, action : req.query.action, room : req.query.room});
});

app.get('/about', function(req,res){
    res.render('about');
});

var rooms = [];

io.on('connection', function(client){
    var curRoom;
    var curName;
    client.on('join',function(data){
        curRoom = data.room;
        curName = data.name;
        client.join(data.room);
        io.to(data.room).emit('update', data.name + ' has joined the chat');
        if (data.action === 'create') {
            rooms.push({ name : data.room, people : [data.name]});
        } else if (data.action === 'join') {
            for (var i=0;i<rooms.length;i++) {
                if (rooms[i].name == data.room) {
                    rooms[i].people.push(data.name);
                }
            }
        }
        io.to(data.room).emit('update-room', rooms);
    });
    client.on('send', function(msg){
        io.to(curRoom).emit('chat', curName + " says: " + msg);
    });
    client.on('disconnect', function(){
        io.to(curRoom).emit('update', curName + ' has left the chat');
        for (var i=0; i<rooms.length; i++) {
            if (rooms[i].name == curRoom) {
                var ppl = rooms[i].people;
                var pos = ppl.indexOf(curName);
                ppl.splice(pos, 1);
            }
        }
        io.to(curRoom).emit('update-room', rooms);
    });
  });


server.listen(port, function(){
    console.log('App is listening on port '+ port);
});