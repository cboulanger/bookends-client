Bookends javascript client
==========================

This code is intended to add scriptability to the Bookends 
reference manager (http://www.sonnysoftware.com), by providing a bridge
betweeen javascript and  the HTTP server built into Bookends, using node-js.

For this to work, you have to copy the "JSON" and "JSON-ID" - format files from 
the "Custom Formats" folder in this project into the following folder:

    ~/Library/Application Support/Bookends/Custom Formats

Also, you need to start the Bookends server (Bookends > Preferences > Server >
[x] Allow Web Access to Libraries, Port : 2001 ) 

The bookends client provides a simple API to retrieve, create and update records,
using javascript and JSON data. This way, you can use javascript code to programmatically 
manipulate your reference data.

Usage:
------

Yoou can use the client in several ways:

1) JSON-Server

The JSON Server uses the Bookends server to create a web service with a very 
simple CRUD-style REST API, returning JSON data. 

start the server with 

node path/to/bookends-client/server/server.js

Your can configure the host and port of the bookends server and of this server
in the config.js file in the same directory. The routes.js file shows you how the
server is using the bookends client API.

The following services are currently implemented:

GET [name of database]/query/[bookends/valentina-style sql query]
    returns an array of objects withs the record data. if nothing was found,
    an empty array is returned.

    Example: http://localhost:8080/mydb/query/title REGEX 'my funny valentina'

GET [name of database]/find/[bookends/valentina-style sql query]
    returns an array of integers, which are the uniqueIds of the records.
    if nothing was found, an empty array is returned

GET /[name of database]/read/[uniqueId]
    returns record as a JSON object

GET /[name of database]/create?authors=Doe,John&title=My funny valentina&year=2007&...
    creates a new record with the given properties
    returns the unique id of the new record 

GET /[name of database]/update/[uniqueId]?keywords=databases&user14=blah
    updates the given properties in the record. returns "OK" if successful

Error handling is very primitive at the moment: error messages are simply returned
unmodified. Deleting records is not supported because the bookends server does not
allow it (which is probably a good idea).

2) Use the API directly
-----------------------

The "examples" directory contains a few sample console scripts that use the 
bookends client API directly. You can start each script directly with node. 



