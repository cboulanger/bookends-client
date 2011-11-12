/**
 * Find and attach PDFs
 * ---------------------------------------
 * 
 * *** Warning ***
 *   This code is experimental/alpha-grade quality. No serious testing has been done.
 *   Don't EVER use real data with it, always use a copy. You have been warned.
 * *** End Warning ***
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

// Handle Mac OS german umlaut decomposition in unicode (NFD)
// other languages have to be added

function normalize( string )
{
    newstring = "";
    for( var i=0; i<string.length; i++)
    {
       if ( i< string.length-1 && string.charCodeAt( i+1) === 776 )
       {
           switch( string.charAt(i) )
           {
               case "a": newstring += "ä"; break;
               case "o": newstring += "ö"; break;
               case "u": newstring += "ü"; break;
               case "A": newstring += "Ä"; break;
               case "O": newstring += "Ö"; break;
               case "O": newstring += "Ü"; break;
           }
           i++;
       }
       else
       {
           newstring += string.charAt(i);
       }
      
    }
    return newstring;
}

function handleFile( file, callback )
{    
    var f   = file.split(/\./),
        key = normalize( f[0].substr(f[0].lastIndexOf("/")+1)),
        ext = f[1];
        
    console.log( "* " + key + "." + ext );        
    client.query(db,"user1 REGEX '" + key + "'" ,function(err,arr){
        if( err ) return callback( new Error("ERROR during query: "+err) );
        if( ! arr.length ) {
            //console.log( "  Key '" + key + "' not found. Trying author/year/title combination..." );
            var matches = key.match(/^([^0-9]+?)\-?([0-9]+)\-?(.*?)$/);
            if ( ! matches )
            {
                console.log("  ### Filename does not provide any usefule information. Skipping...");
                return callback();
            }
            
            var author  = matches[1].split(/\+/)[0],
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
                    console.log("  ### No matching reference found.");
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
        path    = file.substr( 0, file.lastIndexOf("/") ),
        oldname = key + "." + ext,
        newname = data.user1 + "." + ext;
        
    if ( data.user1 !== key )
    {
        console.log("  Key '" +data.user1 + "' doesn't match filename!");
    }
    
    // already attached
    //console.log("  Record data: "+data.attachments+", Existing file name: "+oldname);
    if( typeof data.attachments == "string" && data.attachments.indexOf( oldname ) > -1 )
    {
        //console.log("  File is already attached to record. ");
        callback();
    }
    else
    {
        console.log( "  Found: "+ label.substr(0,60) );
        if ( newname !== oldname ) rename();
        else addAttachmentNotice();
        
        function rename()
        {
            console.log("  Rename '"+oldname+"' to '" + newname  + "' (" + path + ")?");    
            prompt.get([{ name: "answer", message: " [Y]es or [N]o? (default)"}], function (err, result) {
                if( result.answer && result.answer.toLowerCase()  == "y")
                {
                    console.log([path+"/" + oldname, path + "/" +newname]);
                    //fs.renameSync(path+"/" + oldname, path + "/" +newname );    
                }
                addAttachmentNotice();
            });
        }
        
        function addAttachmentNotice()
        {
            var attachmentNotice =  "Unattached document at " + path + "/" + newname + "\n\n";
            if ( data.notes && data.notes.indexOf(attachmentNotice) > -1 )
            {
                console.log("  Attachment notice already present.");
                callback();
            }
            else
            {
                console.log("  Add attachment notice?");
                prompt.get([{ name: "answer", message: " [Y]es or [N]o? (default)"}], function (err, result) {
                    if( result.answer && result.answer.toLowerCase()  == "y")
                    {
                        newdata = { id: data.id, notes : attachmentNotice + ( data.notes || "" ) };
                        client.update(db, newdata, callback );                    
                    }
                    else callback();
                });                
            }
        }
    }
}

function done()
{
    console.log("Done.");
    process.exit(0);
}
