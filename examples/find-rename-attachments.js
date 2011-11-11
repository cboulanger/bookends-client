/**
 * Find and attach PDFs
 * ---------------------------------------
 * 
 * This script, when finished, will scan certain directories for
 * files and try to match them with Bookends references
 * 
 * 
 */

var bookends    = require('../bookends'),
    file        = require('file'),
    fs          = require('fs'),
    prompt      = require('prompt'),
    client      = new bookends.client("localhost",2001),
    
    // configure to your needs:
    db         = "database1.bdb",
    path       = "/Users/Shared/Bibliothek/Volltext"
    ;
    
client.enableDebug(false);
prompt.message = prompt.delimiter = "";
prompt.start();

var allfiles = [];
file.walkSync(path, function(path,dirs,files){
    console.log( "Scanning " + path );
    files.forEach(function(file){
        if( file.substr(0,1) == "." ) return;
        allfiles.push( path + "/" + file );
    });
});

// do the synchronous loop
var counter=0;
(function loop(){
    var file = allfiles[counter++];
    handleFile( file, function(err){
        if( err) {
            console.log(err);
        }
        if( counter < allfiles.length ) loop();
        else done();
    });
})();

function handleFile( file, callback )
{
    console.log( "* " + file);
    var f   = file.split(/\./),
        key = f[0].substr(f[0].lastIndexOf("/")+1),
        ext = f[1];
    client.query(db,"user1 REGEX '" + key + "'" ,function(err,arr){
        if( err ) return callback( new Error("ERROR during query: "+err) );
        if( ! arr.length ) {
            //console.log( "  Key '" + key + "' not found. Trying author/year/title combination..." );
            var matches = key.match(/^([^0-9]+?)\-?([0-9]+)\-?(.*?)$/),
                author  = matches[1].split(/\+/)[0],
                year    = matches[2],
                title   = matches[3],
                query   = "(authors='" + author + "' or editors='" + author +
                          "') and thedate=" + year + 
                          ( title ? " and title='" + title + "'" : "");
            //console.log(query);
            client.query(db,query,function(err,arr){
                if( err ) return callback( new Error("ERROR during query: "+err) );
                if( ! arr.length )
                {
                    console.log("  Nothing found.");
                    return callback();
                }
                handleRecord( file, key, ext, arr[0], callback);
            });
        }
        else handleRecord( file, key, ext, arr[0], callback);
    });
}

function handleRecord( file, key, ext, data, callback )
{
    var label   = ( data.authors || data.editors) + " (" + data.thedate + "), " + data.title,
        oldname = key + "." + ext,
        newname = data.user1 + "." + ext;
        
    console.log( "  Found: "+ label.substr(0,60) );
    if ( data.user1 !== key )
    {
        console.log("  Key '" +data.user1 + "' doesn't match filename!");
    }
    
    // already attached
    console.log("==>"+data.attachments+":"+oldname);
    if( typeof data.attachments == "string" && data.attachments.indexOf( oldname ) > -1 )
    {
        console.log("  File is already attached to record. ");
        callback();
    }
    else
    {
        if ( newname !== oldname ) console.log("  Rename '"+oldname+"' to '" + newname  + "' and attach?");
        else console.log("  Attach file?");
        prompt.get([{ name: "answer", message: " [Y]es (default) or [N]o?"}], function (err, result) {
            //if ( newname !== oldname ) fs.renameSync(path1, path2)
          callback();
        });
    }
}

function done()
{
    console.log("Done.");
    process.exit(0);
}
