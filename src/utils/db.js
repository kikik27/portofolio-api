/* eslint-disable linebreak-style */
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

module.exports = { db };
