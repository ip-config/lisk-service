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
const block = require('./mappings/block');

module.exports = {
	type: 'moleculer',
	method: 'core.blocks',
	params: {
		offset: '=,number',
		limit: '=,number',
		height: '=,number',
		blockId: 'id',
		sort: '=',
		address: '=',
		fromTimestamp: 'from',
		toTimestamp: 'to',
	},
	definition: {
		data: ['data', block],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
		links: {},
	},
};
