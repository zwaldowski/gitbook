var nunjucks = require('nunjucks');
var Immutable = require('immutable');
var Promise = require('../../utils/promise');

describe('TemplateBlock', () => {
    var TemplateBlock = require('../templateBlock');

    describe('create', () => {
        test('must initialize a simple TemplateBlock from a function', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return {
                    body: '<p>Hello, World!</p>',
                    parse: true
                };
            });

            // Check basic templateBlock properties
            expect(templateBlock.getName()).toBe('sayhello');
            expect(templateBlock.getEndTag()).toBe('endsayhello');
            expect(templateBlock.getBlocks().size).toBe(0);
            expect(templateBlock.getExtensionName()).toBe('BlocksayhelloExtension');

            // Check result of applying block
            return Promise()
                .then(function() {
                    return templateBlock.applyBlock();
                })
                .then(function(result) {
                    expect(result.name).toBe('sayhello');
                    expect(result.body).toBe('<p>Hello, World!</p>');
                });
        });
    });

    describe('getShortcuts', () => {
        test('must return undefined if no shortcuts', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return {
                    body: '<p>Hello, World!</p>',
                    parse: true
                };
            });

            expect(templateBlock.getShortcuts()).toBeFalsy();
        });

        test('must return complete shortcut', () => {
            var templateBlock = TemplateBlock.create('sayhello', {
                process: function(block) {
                    return '<p>Hello, World!</p>';
                },
                shortcuts: {
                    parsers: ['markdown'],
                    start: '$',
                    end: '-'
                }
            });

            var shortcut = templateBlock.getShortcuts();

            expect(shortcut).toBeDefined();
            expect(shortcut.getStart()).toEqual('$');
            expect(shortcut.getEnd()).toEqual('-');
            expect(shortcut.getStartTag()).toEqual('sayhello');
            expect(shortcut.getEndTag()).toEqual('endsayhello');
        });
    });

    describe('toNunjucksExt()', () => {
        test('should replace by block anchor', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return 'Hello';
            });

            var blocks = {};

            // Create a fresh Nunjucks environment
            var env = new nunjucks.Environment(null, { autoescape: false });

            // Add template block to environement
            var Ext = templateBlock.toNunjucksExt({}, blocks);
            env.addExtension(templateBlock.getExtensionName(), new Ext());

            // Render a template using the block
            var src = '{% sayhello %}{% endsayhello %}';
            return Promise.nfcall(env.renderString.bind(env), src)
                .then(function(res) {
                    blocks = Immutable.fromJS(blocks);
                    expect(blocks.size).toBe(1);

                    var blockId = blocks.keySeq().get(0);
                    var block = blocks.get(blockId);

                    expect(res).toBe('{{-%' + blockId + '%-}}');
                    expect(block.get('body')).toBe('Hello');
                    expect(block.get('name')).toBe('sayhello');
                });
        });

        test('must create a valid nunjucks extension', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return {
                    body: '<p>Hello, World!</p>',
                    parse: true
                };
            });

            // Create a fresh Nunjucks environment
            var env = new nunjucks.Environment(null, { autoescape: false });

            // Add template block to environement
            var Ext = templateBlock.toNunjucksExt();
            env.addExtension(templateBlock.getExtensionName(), new Ext());

            // Render a template using the block
            var src = '{% sayhello %}{% endsayhello %}';
            return Promise.nfcall(env.renderString.bind(env), src)
                .then(function(res) {
                    expect(res).toBe('<p>Hello, World!</p>');
                });
        });

        test('must apply block arguments correctly', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return {
                    body: '<'+block.kwargs.tag+'>Hello, '+block.kwargs.name+'!</'+block.kwargs.tag+'>',
                    parse: true
                };
            });

            // Create a fresh Nunjucks environment
            var env = new nunjucks.Environment(null, { autoescape: false });

            // Add template block to environement
            var Ext = templateBlock.toNunjucksExt();
            env.addExtension(templateBlock.getExtensionName(), new Ext());

            // Render a template using the block
            var src = '{% sayhello name="Samy", tag="p" %}{% endsayhello %}';
            return Promise.nfcall(env.renderString.bind(env), src)
                .then(function(res) {
                    expect(res).toBe('<p>Hello, Samy!</p>');
                });
        });

        test('must accept an async function', () => {
            var templateBlock = TemplateBlock.create('sayhello', function(block) {
                return Promise()
                    .then(function() {
                        return {
                            body: 'Hello ' + block.body,
                            parse: true
                        };
                    });
            });

            // Create a fresh Nunjucks environment
            var env = new nunjucks.Environment(null, { autoescape: false });

            // Add template block to environement
            var Ext = templateBlock.toNunjucksExt();
            env.addExtension(templateBlock.getExtensionName(), new Ext());

            // Render a template using the block
            var src = '{% sayhello %}Samy{% endsayhello %}';
            return Promise.nfcall(env.renderString.bind(env), src)
                .then(function(res) {
                    expect(res).toBe('Hello Samy');
                });
        });

        test('must handle nested blocks', () => {
            var templateBlock = new TemplateBlock({
                name: 'yoda',
                blocks: Immutable.List(['start', 'end']),
                process: function(block) {
                    var nested = {};

                    block.blocks.forEach(function(blk) {
                        nested[blk.name] = blk.body.trim();
                    });

                    return {
                        body: '<p class="yoda">'+nested.end+' '+nested.start+'</p>',
                        parse: true
                    };
                }
            });

            // Create a fresh Nunjucks environment
            var env = new nunjucks.Environment(null, { autoescape: false });

            // Add template block to environement
            var Ext = templateBlock.toNunjucksExt();
            env.addExtension(templateBlock.getExtensionName(), new Ext());

            // Render a template using the block
            var src = '{% yoda %}{% start %}this sentence should be{% end %}inverted{% endyoda %}';
            return Promise.nfcall(env.renderString.bind(env), src)
                .then(function(res) {
                    expect(res).toBe('<p class="yoda">inverted this sentence should be</p>');
                });
        });
    });
});