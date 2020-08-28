"use strict";

const root = require('app-root-path');
const helpers = require(`${root}/src/helpers`);

class ServiceInfoParser {

    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL    MLS  EQP  ELPD MILES SM'
    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMD'
    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMK'
    //'1N   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMD'
    static isValidHeader(line) {
        return /FLIGHT.*DATE.*SEGMENT.*DPTR.*ARVL.*EQP.*ELPD/.test(line);
    }

    static parseTerminalLine(line) {
        line = line.trim();

        const tokens = line.match(/^(DEP-(?P<departureTerminal>.+?))?(ARR-(?P<destinationTerminal>.+))?$/);
        const self = this;

        if (tokens) {
            const departureTerminal = helpers.orDef(tokens.departureTerminal, '').trim();
            const destinationTerminal = helpers.orDef(tokens.destinationTerminal, '').trim();

            return {
                departureTerminal: {
                    raw: departureTerminal,
                    parsed: self.parseTerminalNumber(departureTerminal),
                },
                destinationTerminal: {
                    raw: destinationTerminal,
                    parsed: self.parseTerminalNumber(destinationTerminal),
                }
            }
        } else {
            return false;
        }
    }

    static parseTerminalNumber(token) {
        token = token.trim();
        let parsed = null;

        if (parsed = token.match(/^TERMINAL (?P<code>[A-Z0-9]{1,2})$/)) {
            return parsed.code;
        } else if (parsed = token.match(/^INTERNATIONAL (?P<code>[A-Z0-9]{1,2})$/)) {
            return parsed.code;
        } else {
            return null;
        }
    }

    static parse(dump) {

    }
}

exports.ServiceInfoParser = ServiceInfoParser;