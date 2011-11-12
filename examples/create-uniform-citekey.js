/**
 * (Almost) unique citation key generation
 * ---------------------------------------
 * 
 * *** Warning ***
 *   This code is experimental/alpha-grade quality. No serious testing has been done.
 *   Don't EVER use real data with it, always use a copy. You have been warned.
 * *** End Warning ***
 * 
 * This script updates all citation keys ("user1" field) to conform to the 
 * following pattern: [last name]-[year]-[first word in title]
 * 
 *  -   two or three authors: name1+name2, > 4: name1-et-al
 *  -   spaces in the author names will be converted to dashes
 *  -   a maximum of two dashes (three words) per author  
 *  -   stop words in title (the, a, der, die, das, ein, eine ..) will be 
 *      ignored
 *  -   Publications with several volumes add the volume number with an additional
 *      dash after the title word.
 * 
 * This pattern allows relatively unique, human readable, and automatically 
 * generateable identifiers for bibliographic references. 
 * 
 * In the rare event that two keys generated this  way conflict, the second, 
 * third, etc. word of the title can be used. 
 * 
 * Examples:
 * 
 * Hall-2000-Aligning
 * Stone-Sweet-2000-Governing
 * Myant+Slocock+Smith-2000-Tripartism
 * Battis+et-al-2000-Grundgesetz
 * van-Hees+Steunenberg-2000-choices
 * Amnesty-International-2000-Lethal
 * Council-of-Europe-2000-Judicial
 * Róna-Tas+Böröcz-2000-Bulgaria
 * The-Harris-Poll-2000-Support
 * Commissioner-for-Civil-2000-Annual
 * 
 * 
 */

var bookends    = require('../bookends'),
    client      = new bookends.client("localhost",2001),
    
    // configure to your needs:
    db          = "database1.bdb",
    stopwords   = "a the ein eine der die das le la l' az", // adapt to your language
    range       = [2000,2000], // set range: [first year,last year]
    
    // don't touch, this variable will be incremented
    year        = range[0]; 
    
//client.enableDebug(true);

function getIdsForYear()
{
    console.log("Retrieving records for " + year + "...");
    client.find(db,"uniqueId IS NOT NULL AND thedate = '" + year + "'", handleIds);    
}

function incrementYear()
{
    if ( year < range[1] ) getIdsForYear(++year);
    else console.log("Done.");
}

function handleIds(err,ids)
{
    if ( err )
    {
        console.log(err);
        return;
    }
    console.log( year + ": found "+ids.length+" records." );
    if ( ids.length == 0 ) {
        incrementYear();
        return;
    }
    var counter = 0;
    (function loop(){
        var id =ids[counter++];
        //console.log( "retrieving record #" + id);
        handleId( id, function(err){
            if( err) {
                console.log("ERROR during update: " + err);   
            }
            if( counter < ids.length ) loop();
            else incrementYear();
        });
    })();
}

function handleId( id, callback )
{
    client.read(db,id,function(err,data){
        if( err ) {
            console.log("ERROR during READ: "+err);
            callback();
        } 
        else handleRecord( data, callback);
    });    
}

function handleRecord(data, callback){
    var authors = data.authors || data.editors || "anonymous",
        year    = data.thedate,
        title   = data.title,
        oldkey  = data.user1,
        newkey  = "";
        
    // see if old key conforms to our key format
    if ( oldkey && oldkey.match(/^[^\-\s]+\-[0-9\-]+\-\S+$/) )
    {
        //console.log(" - OK: " + oldkey);
        callback(); 
        return;
    }
        
    // author part
    var a=[];
    authors.split(/;/).forEach(function(author){
        author = author
            .split(/,/)[0].trim()
            .replace(/ /g,"-")
            .split(/-/).slice(0,3).join("-");
        a.push( author );
    });
    if ( a.length > 3 )
    {
        newkey = a[0]+"+et-al";
    }
    else
    {
        newkey = a.join("+");
    }
    
    // year part
    newkey += "-" + year;
    
    // title part
    title.split(/ /).every(function(word){
        if ( stopwords.indexOf( word.toLowerCase() ) === -1 )
        {
            newkey += "-" + word.replace(/[\x21-\x40]/g,"").replace(/[\x5b-\x60]/g,"");
            return false;
        }
        return true;
    });
    
    console.log( " - " + oldkey + " -> " + newkey);
    var newdata ={
        id : data.id,
        user1:newkey
    };
    client.update(db,newdata,callback);
}

// start
getIdsForYear(year);