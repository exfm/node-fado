var child_process = require('child_process'),
    path = require('path'),
    fs = require('fs'),
    sequence = require('sequence'),
    when = require('when');

module.exports = function(grunt){
    // Project configuration.
    grunt.initConfig({
        lint: {
            all: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
        },
        jshint: {
            options: {
                node: true
            }
        }
    });

    grunt.registerTask('test', function(){
        var done = this.async();
        grunt.helper('jscoverage').then(function(){

            child_process.exec("COVERAGE=1 mocha --reporter html-cov > coverage.html",
                {'COVERAGE': 1, 'NODE_ENVIRONMENT': 'testing'},
                function(err, stdout, stderr) {
                if(err){
                    grunt.warn(err);
                }
                done();
            });
        });
    });

    grunt.registerHelper('jscoverage', function(){
        var d = when.defer();
        sequence(this)
            .then(function(next){
                path.exists(path.resolve('./lib-cov'), next);
            })
            .then(function(next, exists){
                if(exists){
                    return fs.rmdir(path.resolve('./lib-cov'), next);
                }
                return next();
            })
            .then(function(next){
                child_process.exec("jscoverage --no-highlight ./lib ./lib-cov", function(err, stdout, stderr) {
                    d.resolve();
                });
            });
        return d.promise;
    });

    grunt.registerTask('default', 'lint test');

};