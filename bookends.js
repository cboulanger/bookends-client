var querystring = require('querystring'),
    request     = require('request');

/**
 * 
 * @todo Handle "Can't find library"
 */
exports.client = function(host,port)
{
    var host = host || "localhost",
        port = port || 2001,
        server_get_url  = "http://" + host + ":" + port + "/$BEGet?",
        server_post_url = "http://" + host + ":" + port + "/BEPost",
        debug = false;

    /**
     * Cleanup the data sent by the bookends server
     */
    function cleanup ( json )
    {    
        json = json
            .replace(/(\r\n|\r|\n)/g,"")    // strip linebreaks
            .replace(/\\/,"")               // strip backslashes
            .replace(/<HTML><HEAD>.*<\/HEAD><BODY>/i,"") // strip HTML markup
            .replace(/<BR \/><\/BODY><\/HTML>/i,"")
            .replace(/\}\,<BR \/>/gi,"},")  // strip BR tag following a reference
            .replace(/<BR \/>/gi,"\\n")     // convert all others into escaped linebreaks 
            .replace(/[\x00-\x1f]/g,"")     // strip all control characters
            .replace(/\&\#034\;/g,'\\"')    // escape quotation mark
            ;

        json = json.substr( 0, json.length-1 ); // remove trailing comma
        return "[" + json + "]";   
    }    
    
    /**
     * Query the bookends server with a GET request
     * @param data {Object} 
     *      The query data
     * @param callback {function}
     *      The callback receives two argument, error and result.
     *      If successful, the result is an array with the data record 
     *      objects. In case of an error, the error containes an error
     *      object.
     * @param format {String} 
     *      The name of the Bookends format. Defaults to "JSON".
     */
    function query ( database, query, callback, format )
    {
        data = { 
            DB          : database,
            SQLQuery    : query, 
            Format      : format = format || "JSON",
        };
        var url = server_get_url + querystring.stringify(data);
        
        if( debug ) console.log(url);
        
        request(url, function (error, response, body) {
            var beError, result = null;
            if( ! error && body && body.length < 500 ) beError= body.indexOf("Error");
            if ( error || ( beError != -1 && beError < 10 ) ) 
            {
                error = error || new Error( body );
            }
            else if (body.indexOf("No matches were found") !== -1)
            {
                result = [];
            }
            else
            {
                json = cleanup( body );
                try 
                {
                    result = JSON.parse( json );  
                }
                catch( e )
                {
                    // todo: parse bookends error messages
                    error = e+ "\n<pre>" + json + "</pre>";
                }   
            }
            callback( error, result );
        });    
    }
    
    /**
     * Update a record in the bookends server
     * @param data {Object} 
     *      The data object. Must contain at least the "id" property and 
     *      a second property.
     * @param callback {function}
     *      The callback receives one argument, the error object, in case
     *      there was an error. When the update succeeded, the argument
     *      is null. 
     */
    function update( database, data, callback )
    {
        data.db = database;
        data.updateUniqueID = data.id;
        delete data.id;
        var url = server_post_url;
        var options = {
            url : url,
            body : querystring.stringify(data)
        };
        if(debug) console.log(options);
        request.post(options, function (error, response, body) {
            if ( error || ( body.indexOf("successfully updated") == -1 ) ) 
            {
                error = error || new Error( body );
            }
            callback( error );
        });    
    }
    
    /**
     * Create a record in the bookends server
     * @param callback {function}
     *      The callback receives one argument, the error object, in case
     *      there was an error. When the update succeeded, the argument
     *      is null. 
     * @return 
     */
    function create ( database, callback )
    {
        var data = {
            DB : database,
            Filter : "RIS",
            textToImport : "TY Book\nPY 9999\n"
        };
        var url = server_post_url;
        var options = {
            url : url,
            body : querystring.stringify(data)
        };
        if (debug) console.log(options);
        request.post(options, function (error, response, body) {
            console.log(body);
            if ( error || ( body.indexOf("reference imported") == -1 ) ) 
            {
                error = error || new Error( body );
            }
            callback( error );
        });    
    }  

    /**
     * Return the bookends client API
     */
    return {
        
        enableDebug : function(value)
        {
            debug = value;
        },
        
        /**
         * Run a query
         */
        query : function ( database, data, callback )
        {
            query( database, data, callback );  
        },
                
        
        /**
         * Find the ids of the records that match the query.
         * @param data
         * @param callback
         * @return Returns an array of integers with the unique Ids of the
         *      records.
         */
        find : function( database, thequery, callback )
        {
            query( database, thequery, function(error, result) {
                var ids = null;
                if ( ! error )
                {
                    ids = [];
                    result.forEach( function( record ){
                        ids.push( record.id );
                    });
                }
                callback( error, ids );
            },"JSON-ID");
        },
        
        /**
         * Creates a new record
         */
        create : function( database, data, callback )
        {
            var that=this;
            create( database, function(error){
                if ( error ) callback( error, null );
                else that.find( database, "thedate=9999", function (error, result ){
                    if ( error ) callback( error, null );
                    else {
                        if ( ! result || ! result instanceof Array || result.length == 0 )
                        {
                            callback( new Error("No reference created."), null);
                        }
                        else
                        {
                            var id = result[result.length-1];
                            if ( ! data.thedate ) data.thedate = 2011; // todo
                            data.id = id;
                            update( database, data, function(error){
                                if( error ) callback( error,null );
                                else callback( null, id );
                            });                        
                        }
                    }
                });
            }); 
        },
        
        /**
         * Returns the record with the given id
         */
        read : function( database, id, callback )
        {
            query( database, "uniqueId="+ id, function( err, result){
                callback( err, result ? result[0] : null  );
            } );
        },
        
        /**
         * Updates a record.
         */
        update : function( database, data, callback )
        {
            update( database, data, callback ); 
        }
    };
};