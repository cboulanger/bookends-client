var querystring = require('querystring'),
    request     = require('request');

exports.client = function(database,host,port)
{
        
    if( ! database )
    {
        throw new Error("No database specified");
    }

    var host = host || "localhost",
        port = port || 2001,
        server_get_url  = "http://" + host + ":" + port + "/$BEGet?",
        server_post_url = "http://" + host + ":" + port + "/BEPost";

    /**
     * Cleanup the data sent by the bookends server
     */
    function cleanup ( body )
    {    
        body = body
            .replace(/\" /g,'"')
            .replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, ""); // replace tags
        body = body.substr( 0, body.length-1 );
        // todo: convert numerical entities
        //    .replace(/&#(\d+);/g, function(str) {
        //        return "\\" + str;
        //        return String.fromCharCode(RegExp.$1);
        //    });
        
        // this seems to be the only way to strip newlines
        // the usual .replace(/\r/g,""); doesn't work
        var str = "";
        for(var i=0; i<body.length; i++)
        {
            if ( body.charCodeAt(i) !== 10 ){
                str += body.charAt(i);
            }
        }        
        return "[" + str + "]";    
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
    function query ( data, callback, format )
    {
        var key, value;
        for( key in data )
        {
            value = data[key];
            break;
        }
        data = { 
            DB          : database,
            SQLQuery    : key + "=" + value, 
            Format      : format = format || "JSON",
        };
        var url = server_get_url + querystring.stringify(data);
        console.log(url);
        request(url, function (error, response, body) {
            var beError = body.indexOf("Error"), result = null;
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
                    error = e;
                    console.log("Invalid json:" + json);
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
    function update( data, callback )
    {
        data.db = database;
        data.updateUniqueID = data.id;
        delete data.id;
        var url = server_post_url;
        var options = {
            url : url,
            body : querystring.stringify(data)
        };
        console.log(options);
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
    function create ( callback )
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
        console.log(options);
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
        
        /**
         * Run a query
         */
        query : function (data, callback )
        {
            query( data, callback );  
        },
                
        
        /**
         * Find the ids of the records that match the query.
         * @param data
         * @param callback
         * @return Returns an array of integers with the unique Ids of the
         *      records.
         */
        find : function( data, callback )
        {
            query( data, function(error, result) {
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
        create : function( data, callback )
        {
            var that=this;
            create( function(error){
                if ( error ) callback( error, null );
                else that.find( {thedate:9999}, function (error, result ){
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
                            update(data,function(error){
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
        read : function( id, callback )
        {
            query( { uniqueId : id }, callback );
        },
        
        /**
         * Updates a record.
         */
        update : function( data, callback )
        {
            update( data, callback ); 
        }
    };
};