"use strict";

const root = require('app-root-path');

const lib = require(`${root}/index`);
const helpers = require(`${root}/src/helpers`);

const assert = require('assert');

describe('helpers', () => {
    describe('#splitByPosition()', () => {
        it('simple split to four groups', () => {
            const result = helpers.splitByPosition(' 1 DL 789H', 'NN AAFFFFB', {N: 'segmentNumber', A: 'airline', F: 'flightNumber', B: 'bookingClass'}, true);

            assert.equal(result.flightNumber, '789');
            assert.equal(result.segmentNumber, '1');
            assert.equal(result.airline, 'DL');
            assert.equal(result.bookingClass, 'H');
        });
    });

    describe('#splitToLines()', () => {
        it('split string to lines', () => {
            const result = helpers.splitToLines("TEST1\nOLOLOLO\nTEST2");

            assert.equal(result.length, 3);
            assert.equal(result[1], 'OLOLOLO');
        });

        it('returns null if passed value isn\'t a string', () => {
            assert.equal(helpers.splitToLines({}), null);
        });
    });

    describe('#parseGdsPartialDate()', () => {
        it('parses partial dates', () => {
            assert.deepEqual(helpers.parseGdsPartialDate('23MAR'), {raw: '23MAR', day: 23, month: 3});
            assert.deepEqual(helpers.parseGdsPartialDate('03MAR'), {raw: '03MAR', day: 3, month: 3});
            assert.deepEqual(helpers.parseGdsPartialDate('3MAR'), {raw: '3MAR', day: 3, month: 3});
        })

        it('returns null in case it cannot parse date', () => {
            assert.equal(helpers.parseGdsPartialDate('23mar'), null);
            assert.equal(helpers.parseGdsPartialDate('23MAR '), null);
            assert.equal(helpers.parseGdsPartialDate(' 23MAR '), null);
            assert.equal(helpers.parseGdsPartialDate(' 23MAR'), null);
        });
    });

    describe('#convertToFullDateInFuture()', () => {
        it('converts partial date to full date in future', () => {
            assert.equal(helpers.convertToFullDateInFuture('GARBAGE'), null);
            assert.equal(helpers.convertToFullDateInFuture({month: 5, day: 23}, '2020-07-25'), '2021-05-23');
            assert.equal(helpers.convertToFullDateInFuture({month: 5, day: 23}, '2020-05-23'), '2020-05-23');
            assert.equal(helpers.convertToFullDateInFuture({month: 5, day: 23}, '2020-03-23'), '2020-05-23');
        });
    });

    describe('#parseGdsTime()', () => {
        it('parses 24h GDS time format', () => {
            assert.equal(helpers.parseGdsTime('1536'), '15:36');
        });

        it('parses 12h GDS time format', () => {
            assert.equal(helpers.parseGdsTime('435P'), '16:35');
        });
    });

    describe('#fixFirstSegmentLine()', () => {
        it('doesn\'t make any changes to the correct dump', () => {
            const dump = [
                ' 1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), dump);
        });

        it('prepends space in case it was missing', () => {
            const dump = [
                '1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), ' ' + dump);
        });

        it('doesn\'t get fooled by segment numbers starting from 10+', () => {
            const dump = [
                '10 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), dump);
        });

        it('doesn\'t make any changes to the empty string', () => {
            assert.equal(helpers.fixFirstSegmentLine(''), '');
        });

        it('returns null if passed value isn\'t a string', () => {
            assert.equal(helpers.fixFirstSegmentLine(null), null);
            assert.equal(helpers.fixFirstSegmentLine(undefined), null);
            assert.deepEqual(helpers.fixFirstSegmentLine({}), null);
            assert.deepEqual(helpers.fixFirstSegmentLine([1, 2, 3]), null);
        });
    });
});
