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
const redis = require('ioredis');
const { Logger } = require('lisk-service-framework');

const config = require('../config');

const logger = Logger();

const connectionPool = {};

const getDbInstance = async (
	collectionName,
	customIndexes = [],
	endpoint = config.endpoints.redis,
	) => {
	if (!connectionPool[endpoint]) {
		connectionPool[endpoint] = new redis(endpoint);
		connectionPool[endpoint].on('error', (err) => logger.error('connection issues ', err));
	}

	const db = connectionPool[endpoint];
	const collection = config.db.collections[collectionName] || { indexes: [] };
	const { indexes } = collection;

	const write = async (doc) => {
		// Secondary indexes mapping properties to entity IDs
		[...indexes, ...customIndexes].forEach(prop => {
			if (['timestamp'].includes(prop)) db.zadd(collectionName, Number(doc[prop]), doc.id);
			// else if (doc[prop]) db.hmset(`${collectionName}_${prop}`, doc[prop], doc.id);
		});
		// return db.hmset(collectionName, doc.id, JSON.stringify(doc));
	};

	const writeRange = async (index, value) => {
		db.zadd(collectionName, Number(index), value);
	};

	const writeOnce = async (doc) => write(doc);

	const writeBatch = async (docs) => Promise.all(docs.map(async doc => write(doc)));

	const findAll = async () => new Promise(resolve => {
		db.hgetall(collectionName, async (err, result) => {
			if (err) logger.error(`Error retrieving ${collectionName} data: `, err);

			const res = Object.values(result).map(v => JSON.parse(v));
			return resolve(res);
		});
	});

	const find = async (params) => {
		const offset = params.offset || 0;
		const limit = params.limit || 10;

		delete params.offset;
		delete params.limit;

		// TODO: Remove after PouchDB specific code is removed from the shared layer
		if (params.selector) params = params.selector;

		const filterByParams = (item, lParams) => {
			const paramMatches = Object.entries(lParams)
				.filter(([, v]) => v)
				.map(([k, v]) => item[k] === v);
			return paramMatches.reduce((a, b) => a && b, true);
			// return !paramMatches.some(isMatch => !isMatch);
		};

		const result = await findAll();
		const filteredResult = result.filter(item => filterByParams(item, params));

		return filteredResult.slice(offset, offset + limit);
	};

	const findById = async (id) => new Promise(resolve => {
		db.hget(collectionName, id, async (err, result) => {
			if (err) logger.error(`Error retrieving ${collectionName} data with id ${id}: `, err);

			const res = [];
			if (result) res.push(JSON.parse(result));
			return resolve(res);
		});
	});

	const findOneByProperty = async (prop, value) => {
		if ([...indexes, ...customIndexes].includes(prop)) {
			const id = ['timestamp'].includes(prop)
				? await db.zrangebyscore(collectionName, value, value, 'LIMIT', 0, 1)
				: await db.hget(`${collectionName}_${prop}`, value);

			return findById(id);
		}

		const params = {};
		params[prop] = value;
		params.limit = 1;
		return find(params);
	};

	const findByRange = async (prop, from, to, reverse, limit = 1, offset = 0) => {
		if ([...indexes, ...customIndexes].includes(prop)) {
			if (reverse) {
				return db.zrevrangebyscore(collectionName,
					Number(to) || '+Inf', Number(from) || 0,
					'LIMIT', Number(offset), Number(limit));
			}
			return db.zrangebyscore(collectionName,
				Number(from) || 0, Number(to) || '+Inf',
				'LIMIT', Number(offset), Number(limit));
		}
		return [];
	};

	const deleteById = async (id) => db.hdel(collectionName, id);

	const deleteBatch = async (docs) => {
		if (docs instanceof Array && docs.length === 0) return 0;
		return (await Promise.all(docs.map(doc => deleteById(doc.id)))).reduce((a, b) => a + b, 0);
	};

	const deleteByProperty = async (prop, value) => {
		if ([...indexes, ...customIndexes].includes(prop)) {
			const id = ['timestamp'].includes(prop)
				? await db.zrangebyscore(collectionName, value, value, 'LIMIT', 0, 1)
				: await db.hget(`${collectionName}_${prop}`, value);

			db.hdel(`${collectionName}_${prop}`, value);

			return deleteById(id);
		}

		const params = {};
		params[prop] = value;
		const results = await find(params);

		return deleteBatch(results);
	};

	const getCount = () => db.hlen(collectionName);

	return {
		write,
		writeOnce,
		writeBatch,
		findAll,
		find,
		findById,
		findOneByProperty,
		deleteById,
		deleteBatch,
		deleteByProperty,
		getCount,
		writeRange,
		findByRange,
	};
};

module.exports = getDbInstance;
