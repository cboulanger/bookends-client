var express     = require('express'),
    server      = express.createServer(),
    bookends    = require('./bookends'),
    database    = "default.bdb",
    client      = new bookends.client(database);

server.configure(function(){
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(server.router);
    //server.use(express['static'](__dirname + '/public'));
});

server.get('/query', function(req, res){
    client.query( req.query, function(error, result){
        if ( result ) result = JSON.stringify(result);
        else result = "ERROR: " + error;
        res.send(result);
    });
});

server.get('/find', function(req, res){
    client.find( req.query, function(error, result){
        if ( result ) result = JSON.stringify(result);
        else result = "ERROR: " + error;
        res.send(result);
    });
});

server.get('/read', function(req, res){
    client.read( req.query.id, function(error, result){
        if ( result ) result = JSON.stringify(result);
        else result = "ERROR: " + error;
        res.send(result);
    });
});

server.get('/update', function(req, res){
    var data ={};
    for( var key in req.query )
    {
        data[key] = req.query[key];
    }
    client.update( data, function(error, result){
        if ( error ) result = "ERROR: " + error;
        else result ="OK";
        res.send(result);
    });
});

server.get('/create', function(req, res){
    var data ={};
    for( var key in req.query )
    {
        data[key] = req.query[key];
    }
    client.create( data, function(error, result){
        if ( error ) result = "ERROR: " + error;
        else result ="Created record # " + result;
        res.send(result);
    });
});

var port = 8080;
var host = 'localhost';
server.listen(port);
console.log(
    "Bookends bridge running at http://" + host + ":" + port + 
    ", serving database '" + database + "'");