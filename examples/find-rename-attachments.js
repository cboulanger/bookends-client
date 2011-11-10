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
    db          = "database1.bdb",
    client      = new bookends.client("localhost",2001);
    
//client.enableDebug(true);

