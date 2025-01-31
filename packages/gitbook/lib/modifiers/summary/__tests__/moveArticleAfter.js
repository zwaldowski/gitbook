var Immutable = require('immutable');
var Summary = require('../../../models/summary');
var File = require('../../../models/file');

describe('moveArticleAfter', () => {
    var moveArticleAfter = require('../moveArticleAfter');
    var summary = Summary.createFromParts(File(), [
        {
            articles: [
                {
                    title: '1.1',
                    path: '1.1'
                },
                {
                    title: '1.2',
                    path: '1.2'
                }
            ]
        },
        {
            title: 'Part I',
            articles: [
                {
                    title: '2.1',
                    path: '2.1',
                    articles: [
                        {
                            title: '2.1.1',
                            path: '2.1.1'
                        },
                        {
                            title: '2.1.2',
                            path: '2.1.2'
                        }
                    ]
                },
                {
                    title: '2.2',
                    path: '2.2'
                }
            ]
        }
    ]);

    test('moving right after itself should be invariant', () => {
        var newSummary = moveArticleAfter(summary, '2.1', '2.1');

        expect(Immutable.is(summary, newSummary)).toBe(true);
    });

    test('moving after previous one should be invariant too', () => {
        var newSummary = moveArticleAfter(summary, '2.1', '2.0');

        expect(Immutable.is(summary, newSummary)).toBe(true);
    });

    test('should move an article after a previous level', () => {
        var newSummary = moveArticleAfter(summary, '2.2', '2.0');
        var moved = newSummary.getByLevel('2.1');

        expect(moved.getTitle()).toBe('2.2');
        expect(newSummary.getByLevel('2.2').getTitle()).toBe('2.1');
    });

    test(
        'should move an article after a previous and less deep level',
        () => {
            var newSummary = moveArticleAfter(summary, '2.1.1', '2.0');
            var moved = newSummary.getByLevel('2.1');

            expect(moved.getTitle()).toBe('2.1.1');
            expect(newSummary.getByLevel('2.2.1').getTitle()).toBe('2.1.2');
            expect(newSummary.getByLevel('2.2').getTitle()).toBe('2.1');
        }
    );

    test('should move an article after a next level', () => {
        var newSummary = moveArticleAfter(summary, '2.1', '2.2');
        var moved = newSummary.getByLevel('2.2');

        expect(moved.getTitle()).toBe('2.1');
        expect(newSummary.getByLevel('2.1').getTitle()).toBe('2.2');
    });

});
