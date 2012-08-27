# exfacebook

## Examples


    var fb = require('exfacebook');
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


