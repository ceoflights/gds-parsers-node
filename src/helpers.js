"use strict";

const moment = require('moment');

exports.mkResult = function(result) {
    return {success: true, result: result};
};

exports.mkError = function(errors) {
    if (!Array.isArray(errors)) {
        return {success: false, errors: [errors]};
    } else {
        return {success: false, errors: errors};
    }
};

exports.orDef = function(val, def) {
    if (val === null) {
        return def;
    } else if (typeof(val) === 'undefined') {
        return def;
    } else {
        return val;
    }
};

const parse12hTime = function(token) {
    const timeOfDayMapping = {
        P: 'PM',
        N: 'PM',
        A: 'AM',
        M: 'AM',
    };

    const paddedToken = token.padStart(5, '0');
    
    const timeOfDayToken = paddedToken.substr(4);
    let hours = paddedToken.substr(0, 2);
    hours = hours === '00' ? '12' : hours;
    const minutes = paddedToken.substr(2, 2);
    const timeOfDay = timeOfDayMapping[timeOfDayToken];

    if (timeOfDay && hours && minutes) {
        const full12HoursString = hours + ':' + minutes + ' ' + timeOfDay;

        return moment('2020-07-29 ' + full12HoursString, 'YYYY-MM-DD hh:mm a').format('HH:mm');
    } else {
        return null;
    }
};

const parse24hTime = function(token) {
    const paddedToken = token.padStart(4, '0');
    const hours = paddedToken.substr(0, 2);
    const minutes = paddedToken.substr(2, 2);

    return hours + ':' + minutes;
};

exports.parseGdsTime = function(token) {
    if (typeof token === 'string') {
        token = token.trim();
        
        if (/^\d+[A-Z]$/.test(token)) {
            return parse12hTime(token);
        } else if (/^\d+$/.test(token)) {
            return parse24hTime(token);
        } else {
            return null;
        }
    } else {
        return null;
    }
};

exports.decodeDayOffset = function(token) {
    if (token == '') {
        return 0;
    } else if (token == '|' || token == '+') {
        return 1;
    } else if (token == '-') {
        return -1;
    } else if (parseInt(token)) {
        return parseInt(token);
    } else if (token == '#') { // Galileo
        return 1;
    } else if (token == '*') { // Galileo
        return 2;
    } else {
        return null;
    }
};

exports.parseGdsPartialDate = function(token) {
    const matches = token.match(/^(\d{1,2})([A-Z]{3})$/);

    const mapping = {
        'JAN': 1, 
        'FEB': 2, 
        'MAR': 3, 
        'APR': 4, 
        'MAY': 5, 
        'JUN': 6, 
        'JUL': 7, 
        'AUG': 8, 
        'SEP': 9, 
        'OCT': 10, 
        'NOV': 11, 
        'DEC': 12,
    };

    if (matches) {
        return {raw: token, day: parseInt(matches[1]), month: mapping[matches[2]]};
    } else {
        return null;
    }
};

exports.convertToFullDateInFuture = function(date, baseDate) {
    if (date.hasOwnProperty('day') && date.hasOwnProperty('month')) {
        baseDate = moment(baseDate).format('YYYY-MM-DD');

        let assumedYear = parseInt(moment(baseDate).format('YYYY'));
        let assumedDate = null;
        do {
            assumedDate = moment([assumedYear.toString(), date.month.toString().padStart(2, '0'), date.day.toString().padStart(2, '0')].join('-')).format('YYYY-MM-DD');
            assumedYear += 1;
        } while (assumedDate < baseDate || !(parseInt(moment(assumedDate).format('MM')) === date.month && parseInt(moment(assumedDate).format('DD')) === date.day))
        
        return assumedDate;
    } else {
        return null;
    }
};

exports.splitByPosition = function(subject, pattern, names, trim) {
    const letters = {};
    let position = 0;

    pattern.split('').forEach((markerChar) => {
        if (markerChar in letters) {
            letters[markerChar] += subject.substr(position, 1);
        } else {
            letters[markerChar] = subject.substr(position, 1);
        }
        position += 1;
    });

    const result = {};

    Object.keys(names).forEach((markerChar) => {
        const name = names[markerChar];
        result[name] = trim ? exports.orDef(letters[markerChar], '').trim() : letters[markerChar];
    });

    return result;
};

exports.splitToLines = function(string) {
    if (typeof string === "string") {
        return string.split(/\r\n|\n|\r/);
    } else {
        return null;
    }
}

// Agents often miss leading space in the first line when pasting PQs. No harm detecting and fixing it on our side.
exports.fixFirstSegmentLine = function(string) {
    if (typeof string === 'string') {
        const lines = exports.splitToLines(string);

        if (lines.length > 0 && /^\d(\s|\.\s)[A-Z\d]/.test(lines[0])) {
            return ' ' + string;
        } else {
            return string;
        }
    } else {
        return null;
    }
}

exports.parseTravelportDayOfWeek = function(token) {
    const mapping = {
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
        SU: 7,
    };

    if (token && mapping.hasOwnProperty(token)) {
        return mapping[token];
    } else {
        return null;
    }
};

exports.parseSabreDayOfWeek = function(token) {
    const mapping = {
        M: 1,
        T: 2,
        W: 3,
        Q: 4,
        F: 5,
        J: 6,
        S: 7,
    };

    if (token && /^\d$/.test(token)) {
        return token;
    } else if (token && mapping.hasOwnProperty(token)) {
        return mapping[token];
    } else {
        return null;
    }
};