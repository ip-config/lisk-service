/*
 * LiskHQ/lisk-service
 * Copyright © 2020 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
const config = require('../../../config');
const db = require('../../database')[config.db.collections.accounts.db || config.db.defaults.db];

const getAddressByPublickKey = async (publicKey) => {
    const accountdb = await db(config.db.collections.accounts.name);
    const [address] = await accountdb.find(publicKey);
    if (address) return address;
    return null;
};

const getAddressBySecPublickKey = async (publicKey) => {
    const accountdb = await db(config.db.collections.accounts.name);
    const [address] = await accountdb.find(publicKey);
    if (address) return address;
    return null;
};

const getAddressByusername = async (username) => {
    const accountdb = await db(config.db.collections.accounts.name);
    const [address] = await accountdb.find(username);
    if (address) return address;
    return null;
};

module.exports = {
    getAddressByPublickKey,
    getAddressBySecPublickKey,
    getAddressByusername,
};
