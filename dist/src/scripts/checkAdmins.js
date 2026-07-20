"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});
pool.connect()
    .then((c) => {
    return c.query('SELECT * FROM app.users WHERE user_type=$1 LIMIT 2', ['admin']);
})
    .then(({ rows }) => {
    console.log('Admins:', JSON.stringify(rows, null, 2));
})
    .catch((e) => console.error(e))
    .finally(() => pool.end());
