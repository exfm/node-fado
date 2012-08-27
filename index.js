"use strict";

var covRequire = function(s){
    if(process.env.COVERAGE){
        s = s.replace('lib', 'lib-cov');
    }
    return require(s);
};
module.exports = covRequire('./lib');