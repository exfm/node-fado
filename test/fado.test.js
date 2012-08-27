"use strict";

var fado = require('../'),
    assert = require('assert');


// Create uninstalled user
// https://graph.facebook.com/163676270364271/accounts/test-users?installed=false&name=Exfm%20Tester&locale=en_US&permissions=email,publish_actions&method=post&access_token=163676270364271|IwEsE-F6hsgNOSsDTcETDMPxkkE


// Create installed user
//https://graph.facebook.com/163676270364271/accounts/test-users?installed=true&name=Exfm%20Tester&locale=en_US&permissions=email,publish_actions&method=post&access_token=163676270364271|IwEsE-F6hsgNOSsDTcETDMPxkkE
// {
// id: "100004245250794",
// access_token: "AAACU3Nn0Bm8BAFCRWy4YEe5N8QngZAyWgLk6kZB41ZB8APogiDDxvUrHtKR2veylLj2fWtYuC1c2CR2UaZCM3nu0e2JvRqcyr2avmtKi5DvilhimT60r",
// login_url: "https://www.facebook.com/platform/test_account_login.php?user_id=100004245250794&n=CAXcg8rKZX7A9rS",
// email: "exfm_xgpsgiq_tester@tfbnw.net",
// password: "2060802158"
// }

var APP_ACCESS_TOKEN = '163676270364271|IwEsE-F6hsgNOSsDTcETDMPxkkE';
var TOKEN = 'AAACU3Nn0Bm8BAP3YbI04lUrqcHZClI1u8e4pYL6jtJoJwS7ZB199gP1H7d12LZCX7rZBK81eKIzRypK1f0OuthfzZCbG7v64ZCHdewlm79ATKUZAGW08TFs';

describe('fado', function(){
    before(function(){
        fado.configure('163676270364271', '3d8d3f9a292a890e2706d0a51cda0173',
            'exfmmusicdev');
    });

    describe('@slow', function(){
        it("should return my profile", function(done){
            var req = fado.getProfile(TOKEN);
            req.on('error', assert.fail);
            req.on('tokenExchanged', assert.fail);
            req.on('needsReconnect', assert.fail);
            req.on('data', function(d){
                done();
            });
            req.send();
        });

        it("should return my friend ids", function(done){
            var req = fado.getFriendIds(TOKEN);
            req.on('error', assert.fail);
            req.on('tokenExchanged', assert.fail);
            req.on('needsReconnect', assert.fail);
            req.on('data', function(d){
                done();
            });
            req.send();
        });

        it("should sanitize profile", function(done){
            var req = fado.getProfile(TOKEN);
            req.on('error', assert.fail);
            req.on('tokenExchanged', assert.fail);
            req.on('needsReconnect', assert.fail);
            req.on('data', function(d){
                fado.sanitizeProfile(d).then(function(p){
                    assert.equal(p.lookupId, '100004247290652');
                    assert.equal(p.name, 'Exfm Tester');
                    assert.equal(p.pic, 'https://graph.facebook.com/100004247290652/picture?type=large');
                    assert.equal(p.email, 'exfm_gxvrbnx_tester@tfbnw.net');
                    assert.equal(p.website, null);
                    assert.equal(p.bio, null);
                    assert.equal(p.location, null);
                    assert.equal(p.isDefaultProfileImage, true);
                    assert.equal(p.username, 'exfm_tester');
                    done();
                });
            });
            req.send();
        });

        it("should work with loves", function(done){
            var req = fado.love(TOKEN, 'http://ex.fm/song/e7zup');
            req.on('error', assert.fail);
            req.on('tokenExchanged', assert.fail);
            req.on('needsReconnect', assert.fail);
            req.on('data', function(d){
                done();
            });
            req.send();
        });

        it("should work with scrobbles", function(done){
            var req = fado.scrobble(TOKEN, 'http://ex.fm/song/e7zup');
            req.on('error', assert.fail);
            req.on('tokenExchanged', assert.fail);
            req.on('needsReconnect', assert.fail);
            req.on('data', function(d){
                done();
            });
            req.send();
        });
    });

    describe('@fast', function(){
        it("should return touch authorize URL", function(){
            var result = fado.getAuthorizeRedirectUrl('http://localhost/',
                'm'),
                expected = 'https://m.facebook.com/dialog/oauth?client_id=163676270364271&redirect_url=http%3A%2F%2Flocalhost%2F&dsiplay=touch&scope=email%2Cpublish_actions';

            assert.equal(result, expected);
        });

        it("should return popup authorize URL", function(){
            var result = fado.getAuthorizeRedirectUrl('http://localhost/',
                'www'),
                expected = 'https://www.facebook.com/dialog/oauth?client_id=163676270364271&redirect_url=http%3A%2F%2Flocalhost%2F&dsiplay=popup&scope=email%2Cpublish_actions';
            assert.equal(result, expected);
        });

        it("should return correct share URL", function(){
            var result = fado.getShareUrl('m', 'http://localhost',
                'http://localhost/song/1', 'Matriarch', 'The Suits',
                'The Suits EP', 'lucas', 'http://localhost/lucas'),
                expected = 'https://m.facebook.com/dialog/feed/app_id=163676270364271&redirect_uri=http%3A%2F%2Flocalhost&display=touch&link=http%3A%2F%2Flocalhost%2Fsong%2F1&ref=actor&name=Matriarch%20by%20The%20Suits';
            assert.equal(result, expected);
        });
    });

});