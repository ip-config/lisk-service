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
const { HTTP, Utils, Logger } = require('lisk-service-framework');

const { StatusCodes: { NOT_FOUND } } = HTTP;
const { isEmptyArray } = Utils.Data;

const CoreService = require('../../shared/core');
const config = require('../../config');

const logger = Logger();

const knownExpireMiliseconds = 5 * 60 * 1000;
const staticUrl = config.endpoints.liskStatic;

const getKnownAccounts = async () => {
	const result = await CoreService.getNetworkStatus();
	const { nethash } = result.data.constants;
	const cacheTTL = knownExpireMiliseconds;

	try {
		const knownNetworks = await HTTP.request(`${staticUrl}/networks.json`, { cacheTTL });
		if (knownNetworks.data[nethash]) {
			return (await HTTP.request(`${staticUrl}/known_${knownNetworks.data[nethash]}.json`, { cacheTTL })).data;
		}
		return {};
	} catch (err) {
		return {};
	}
};

const getDataForAccounts = async params => {
	const accounts = await CoreService.getAccounts(params);

	const response = {};
	response.data = [];
	response.meta = {};
	response.links = {};

	if (!accounts.data || isEmptyArray(accounts.data)) {
		response.meta.count = 0;
		response.meta.total = 0;
	} else {
		const knownAccounts = await getKnownAccounts();
		const data = await Promise.all(accounts.data.map(async account => {
			account.multisignatureGroups = await CoreService.getMultisignatureGroups(account);
			account.incomingTxsCount = await CoreService.getIncomingTxsCount(account.address);
			account.outgoingTxsCount = await CoreService.getOutgoingTxsCount(account.address);
			account.multisignatureMemberships = await CoreService.getMultisignatureMemberships(
				account);
			account.knowledge = knownAccounts[account.address] || {};
			return account;
		}));

		response.data = data;
		response.meta.count = data.length;
		response.meta.offset = parseInt(params.offset, 10);
	}

	return response;
};

const getAccounts = async params => {
	const isFound = await CoreService.confirmAnyId(params);
	if (typeof params.anyId === 'string' && !params.address) return { status: NOT_FOUND, data: { error: `Account ${params.anyId} not found.` } };
	if (!isFound && params.address) return { status: NOT_FOUND, data: { error: `Account ${params.address} not found.` } };
	if (!isFound && params.username) return { status: NOT_FOUND, data: { error: `Account ${params.username} not found.` } };
	if (!isFound && params.publicKey) return { status: NOT_FOUND, data: { error: `Account with a public key ${params.publicKey} not found.` } };
	if (!isFound && params.secondPublicKey) return { status: NOT_FOUND, data: { error: `Account with a second public key ${params.secondPublicKey} not found.` } };

	try {
		const response = await getDataForAccounts({ sort: 'balance:asc', ...params });

		return {
			data: response.data,
			meta: response.meta,
		};
	} catch (err) {
		logger.error(err.stack);
		return {
			data: [],
			meta: {},
		};
	}
};

const getTopAccounts = async params => {
	const response = await getDataForAccounts(Object.assign(params, {
		sort: 'balance:desc',
		limit: params.limit,
		offset: params.offset,
	}));

	return {
		data: response.data,
		meta: response.meta,
		links: response.links,
	};
};

module.exports = {
	getAccounts,
	getTopAccounts,
};
