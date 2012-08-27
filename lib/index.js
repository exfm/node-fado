"use strict";

var util = require('util'),
    events = require('events'),
    querystring = require("querystring"),
    superagent = require('superagent'),
    when = require('when'),
    sequence = require('sequence');


function Request(token){
    this.token = token;
    this.path = null;
    this.args = {
        'access_token': this.token
    };
    this.postData = null;
}
util.inherits(Request, events.EventEmitter);

Request.prototype.getObject = function(id){
    this.path = id;
    return this;
};

Request.prototype.putObject = function(parentObject, connectionName, obj){
    this.path = parentObject + "/" + connectionName;
    this.postData = {};
    Object.keys(obj).forEach(function(key){
        var val = obj[key];
        this.postData[key] = val;
    }.bind(this));
    return this;
};

Request.prototype.getConnections = function(id, connectionName){
    this.path = id + "/" + connectionName;
    return this;
};

Request.prototype.exchangeToken = function(){
    var d = when.defer(),
        newToken,
        response;
    superagent.get('https://graph.facebook.com/oauth/access_token')
        .data({
            'client_id': module.exports.APP_ID,
            'client_secret': module.exports.APP_SECRET,
            'grant_type': 'fb_exchange_token',
            'fb_exchange_token': this.token
        }).end(function(res){
            if(res.status >= 400){
                this.emit('tokenExchangeError', res.text);
                return d.reject(res.text);
            }

            response = querystring.parse(res.text),
                newToken = response.access_token;

            this.emit('tokenExchanged', newToken);
            d.resolve(newToken);

        }.bind(this));
    return d.promise;
};

// Make the actual request.
Request.prototype.send = function(){
    var url = 'https://graph.facebook.com/' + this.path,
        isPost = (this.postData !== null),
        req;

    if(isPost){
        req = superagent.post(url)
            .send(this.postData);
    }
    else{
        req = superagent.get(url)
            .send(this.args);
    }
    req.query({'access_token': this.token});
    req.end(function(res){
        var content = JSON.parse(res.text),
            errorMessage;

        if(!content.hasOwnProperty('error')){
            return this.emit('data', content);
        }

        errorMessage = content.error.message;
        if(errorMessage.indexOf('Session has expired') > -1){
            return this.exchangeToken().then(function(newToken){
                this.token = newToken;
                this.send();
            }.bind(this));
        }
        else if(errorMessage.indexOf('Error validating access token') > -1 || errorMessage.indexOf('Invalid OAuth access token') > -1){
            return this.emit('needsReconnect');
        }

        return this.emit('error', content);
    }.bind(this));
    return this;
};

module.exports.APP_ID = null;
module.exports.APP_SECRET = null;
module.exports.APP_NAMESPACE = null;

// Shortcut for setting all configuration vals at once.
module.exports.configure = function(id, secret, namespace){
    module.exports.APP_ID = id;
    module.exports.APP_SECRET = secret;
    module.exports.APP_NAMESPACE = namespace;
};

module.exports.getFriendIds = function(token){
    return new Request(token).getConnections('me', 'friends');
};

module.exports.getProfile = function(token){
    return new Request(token).getObject('me');
};

// Takes info from getProfile and cleans it up a bit.
module.exports.sanitizeProfile = function(profile){
    var d = when.defer(),
        lookupId = String(profile.id),
        data = {
            'lookupId': lookupId,
            'name': profile.name || '',
            'pic': 'https://graph.facebook.com/'+lookupId+'/picture?type=large',
            'email': profile.email || null,
            'website': profile.website || null,
            'bio': profile.bio || null,
            'location': profile.location || null,
            'isDefaultProfileImage': false
        },
        picRedirectUrl,
        username = profile.username || data.name.toLowerCase()
            .replace(' ', '_');

    sequence(this).then(function(next){
        superagent.head(data.pic)
            .end(function(res){
                picRedirectUrl = res.redirects[0];
                next();
            });
    }).then(function(next){
        // Check if its just a default picture
        data.isDefaultProfileImage = (picRedirectUrl.match(/\.png|static|\.gif/) !== null);
        data.username = username;
        d.resolve(data);
    });
    return d.promise;

};

module.exports.updateFeed = function(token, data){
    return new Request(token).putObject('me', 'feed', data);
};

module.exports.getLoves = function(token){
    return new Request(token).getConnections('me',
        [module.exports.APP_NAMESPACE, 'love'].join(':'));
};

module.exports.scrobble = function(token, url){
    return new Request(token).putObject('me',
        [module.exports.APP_NAMESPACE, 'play'].join(':'),
        {'song': url});
};

module.exports.love = function(token, url){
    return new Request(token).putObject('me',
        [module.exports.APP_NAMESPACE, 'love'].join(':'),
        {'song': url});
};

module.exports.getShareUrl = function(display, redirectUrl, songUrl, title, artist, album, username, userUrl){
    var params = {
        'app_id': module.exports.APP_ID,
        'redirect_uri': redirectUrl,
        'display': (display === 'm') ? 'touch': 'popup',
        'link': songUrl,
        'ref': 'noactor'
    }, properties;

    if(artist){
        params.name = title + ' by ' + artist;
    }
    if(username){
        params.ref = 'actor';
        properties = {
            'My Loved Songs': {
                'href': userUrl,
                'text': 'ex.fm/'+username
            }
        };
    }
    return "https://"+ (display || 'www') + ".facebook.com/dialog/feed/" + querystring.stringify(params);
};



// Make the URL needed for a user to authenticate with Facebook,
// allow exfm to access selected data from his Facebook account,
// then redirect back to exfm.
module.exports.getAuthorizeRedirectUrl = function(callbackUri, display, scope){
    display = display || 'www';
    scope = scope || 'email,publish_actions';

    return util.format("https://%s.facebook.com/dialog/oauth?%s", display,
        querystring.stringify({
        'client_id': module.exports.APP_ID,
        'redirect_url': callbackUri,
        'dsiplay': (display === 'm') ? 'touch': 'popup',
        'scope': scope
    }));
};

// When the user authorizes our app, we request an access token.
module.exports.onAuthorize = function(callbackUri, code){
    var d = when.defer();
    superagent.get('https://graph.facebook.com/oauth/access_token')
        .send({
            'client_id': module.exports.APP_ID,
            'redirect_uri': callbackUri,
            'client_secret': module.exports.APP_SECRET,
            'code': code
        })
        .end(function(res){
            if(res.status >= 400){
                return d.reject(new Error(res.text));
            }
            d.resolve(querystring.parse(res.text));
        });
    return d.promise;
};