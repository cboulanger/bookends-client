var express     = require('express'),
    server      = express.createServer(),
    bookends    = require('./bookends'),
    config      = require('./config');
     
server.configure(function(){
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(server.router);
    //server.use(express['static'](__dirname + '/public'));
});    

// bookends client
var bconf = config.bookends;
var client  = new bookends.client( bconf.host, bconf.port );
    
// routing
require("./routes").setRoutes( server, client );

server.listen(config.server.port);
var msg = "Bookends bridge running at http://" + config.server.host + ":" + config.server.port;
console.log(msg);