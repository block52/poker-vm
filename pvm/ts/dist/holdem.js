"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Holdem = void 0;
const types_1 = require("./types");
class Holdem {
    constructor() {
        this.readonly = [];
        this.deck = new types_1.Deck();
    }
    shuffle(seed) {
        return "";
    }
}
exports.Holdem = Holdem;
//# sourceMappingURL=holdem.js.map