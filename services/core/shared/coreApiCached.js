/*
 * LiskHQ/lisk-service
 * Copyright © 2019 Lisk Foundation
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
const { HTTP } = require('lisk-service-framework');
const coreApi = require('./coreApi');

const {
	request,
	...coreApiGetters
} = coreApi;

const coreApiCached = Object.entries(coreApiGetters).reduce((accumulator, key) => ({
	...accumulator,
	[key]: (requestParams, { expireMiliseconds } = {}) => (
		HTTP.request(key, {
			...requestParams,
			cacheTTL: expireMiliseconds,
		})
	),
}), {});

module.exports = coreApiCached;