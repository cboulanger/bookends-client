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
        server_get_url = "http://" + host + ":" + port + "/$BEGet?";

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
     * Return the bookends client API
     */
    return {

        /**
         * Query the bookends server
         * @param query {Object} 
         *      The query parameters
         * @param callback {function}
         *      The callback receives two argument, error and result.
         *      If successful, the result is an array with the data record 
         *      objects. In case of an error, the error containes an error
         *      object.
         * @param format {String} 
         *      The name of the Bookends format. Defaults to "JSON".
         */
        query : function ( query, callback, format )
        {
            query.format = format || "JSON";
            query.db     = database;
            var url = server_get_url + querystring.stringify(query);
            console.log(url);
            request(url, function (error, response, body) {
                var beError = body.indexOf("Error"), result = null;
                if ( error || ( beError != -1 && beError < 10 ) ) 
                {
                    error = error || new Error( body );
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
                    }   
                }
                callback( error, result );
            });    
        },
        
        /**
         * Finds the ids of the records that match the query.
         * @param query
         * @param callback
         * @return Returns an array of integers with the unique Ids of the
         *      records.
         */
        find : function( query, callback )
        {
            this.query( query, function(error, result) {
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
         * Returns the record with the given id
         */
        read : function( id, callback )
        {
            this.query( { SQLQuery : "uniqueId=" + id }, callback );
        }
        
        
    };
};