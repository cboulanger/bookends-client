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
    client      = new bookends.client("localhost",2001),
    
    // configure to your needs:
    db         = "database1.bdb",
    path       = "/Users/Shared/Bibliothek/Volltext"
    ;
    
client.enableDebug(false);

var allfiles = [];
file.walkSync(path, function(path,dirs,files){
    console.log( "Scanning " + path );
    files.forEach(function(file){
        if( file.substr(0,1) == "." ) return;
        allfiles.push( file );
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
    console.log( " - " + file);
    var f   = file.split(/\./),
        key = f[0],
        ext = f[1];
    client.query(db,"user1 REGEX '" + key + "'" ,function(err,arr){
        if( err ) {
            callback( new Error("ERROR during READ: "+err) ) ;
        } 
        else if ( ! arr.length ) {
            console.log( "  Key '" + key + "' not found." );
            callback();
        }
        else handleRecord( key, ext, arr[0], callback);
    });
}

function handleRecord( key, ext, data, callback )
{
    console.log( [key,ext,data.user1,data.attachments]);
    callback();
}

function done()
{
    console.log("Done.");
    process.exit(0);
}
