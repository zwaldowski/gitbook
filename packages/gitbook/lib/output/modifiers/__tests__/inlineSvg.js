var cheerio = require('cheerio');
var tmp = require('tmp');
var path = require('path');
var fs = require('fs');

describe('inlineSvg', () => {
    var dir;
    var svgPath;
    var inlineSvg = require('../inlineSvg');

    beforeEach(() => {
        dir = tmp.dirSync();
        svgPath = path.join(dir.name, 'test.svg');
    });

    test('should inline svg icons', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" version="1.1"><rect width="200" height="100" stroke-width="6"/></svg>';
        var $ = cheerio.load('<img src="test.svg"/>');
        return fs.promises.writeFile(svgPath, svg)
            .then(function(){
                return inlineSvg(dir.name, 'index.html', $);
            })
            .then(function(){
                expect($('svg').attr('fill')).toBe('currentColor');
            });
    });

    test('should not inline svgs with style tags', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" version="1.1" style="background-color:red"><rect width="200" height="100" stroke="black" stroke-width="6" fill="green"/></svg>';
        var $ = cheerio.load('<img src="test.svg"/>');
        return fs.promises.writeFile(svgPath, svg)
            .then(function(){
                return inlineSvg(dir.name, 'index.html', $);
            })
            .then(function(){
                expect($('svg').length).toBe(0);
            });
    });

});
