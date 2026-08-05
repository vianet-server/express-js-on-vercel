"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * index.ts
 *
 * Barrel for all DB-query modules. Each router should prefer its own domain
 * module (admin / employee / partner / api) — all of which re-export the shared
 * helpers — and only fall back to `shared` when no domain module exists.
 */
module.exports = {
    shared: require('./shared'),
    admin: require('./admin'),
    employee: require('./employee'),
    partner: require('./partner'),
    api: require('./api'),
};
