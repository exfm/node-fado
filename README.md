# fado

A nice, modern node.js interface for facebook.

"Fado (Portuguese pronunciation: [ˈfaðu], "destiny, fate") is a music genre which can be traced to the 1820s in Portugal, but probably with much earlier origins."
[Wikipedia](http://en.wikipedia.org/wiki/Fado)

## Examples


    var fb = require('fado');
    fb.configure(appId, secret, appNamespace);
    var req = fb.love(<token>, <songUrl>)

    req.on('error', function(err){
        console.error(err);
    });

    req.on('data', function(data){
        console.log('success! ', data);
    });

    req.on('tokenExchanged', function(newToken){
        console.log('Token exchanged during request: ' + newToken);

    });

    req.on('needsReconnect', function(){
        console.log('User needs to reconnect to facebook!');
    });

    req.send();
