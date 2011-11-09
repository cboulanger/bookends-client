exports.setRoutes = function(server, client){
    
    server.get('/test/:foo/:bar', function( req, res ){
        console.log(req.params);
        res.send("ok");
    })


    server.get('/:db/query/:query', function(req, res){
        client.query( req.params.db, req.params.query, function(error, result){
            if ( result ) result = JSON.stringify(result);
            else result = "ERROR: " + error;
            res.send(result);
        });
    });
    
    server.get('/:db/find/:id', function(req, res){
        client.find( req.params.db, req.params.id, function(error, result){
            if ( result ) result = JSON.stringify(result);
            else result = "ERROR: " + error;
            res.send(result);
        });
    });
    
    server.get('/:db/read/:id', function(req, res){
        client.read( req.params.db, req.params.id, function(error, result){
            if ( result ) result = JSON.stringify(result);
            else result = "ERROR: " + error;
            res.send(result);
        });
    });
    
    server.get('/:db/update/:id', function(req, res){
        var data ={ id : req.params.id };
        for( var key in req.query )
        {
            if (key == "id") continue;
            data[key] = req.query[key];
        }
        client.update( req.params.db, data, function(error, result){
            if ( error ) result = "ERROR: " + error;
            else result ='"OK"';
            res.send(result);
        });
    });
    
    server.get('/:db/create', function(req, res){
        var data ={};
        for( var key in req.query )
        {
            data[key] = req.query[key];
        }
        client.create( req.params.db, data, function(error, result){
            if ( error ) result = "ERROR: " + error;
            res.send(result);
        });
    });
};