Bookends javascript bridge
==========================

This code is intended to add scriptable data manipulation to the Bookends 
reference manager (http://www.sonnysoftware.com), by providing a bridge
betweeen javascript and  the HTTP server built into Bookends, using node-js.

For this to work, you have to copy the "JSON" - format file from the "Custom 
Formats" folder in this project into the following folder:

    ~/Library/Application Support/Bookends/Custom Formats

The bookends bridge provides a simple API to retrieve, create and update records,
using JSON data. This way, you can use javascript code to programmatically 
manipulate your reference data.
