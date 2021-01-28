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
const { Logger } = require('lisk-service-framework');
const config = require('../../config');

const logger = Logger();

const connectionPool = {};
const tablePool = {};

const loadSchema = async (knex, tableName, tableConfig) => {
	const { primaryKey, schema, indexes } = tableConfig;

	if (await knex.schema.hasTable(tableName)) return knex;

	await knex.schema
	.createTable(tableName, table => {
		Object.keys(schema).map(p => {
			const kProp = (table[schema[p].type])(p);
			if (schema[p].null === false) kProp.notNullable();
			if (p === primaryKey) kProp.primary();
			if (indexes[p]) kProp.index();
			return kProp;
		});
	});

	return knex;
};

const createDb = async (connEndpoint) => {
	const knex = require('knex')({
		client: 'mysql',
		version: '5.7',
		connection: connEndpoint,
		useNullAsDefault: true,
		log: {
			warn(message) { logger.warn(message); },
			error(message) { logger.error(message); },
			deprecate(message) { logger.deprecate(message); },
			debug(message) { logger.debug(message); },
		},
	});

	return knex;
};

const cast = (val, type) => {
	if (type === 'number') return Number(val);
	if (type === 'integer') return Number(val);
	if (type === 'string') return String(val);
	if (type === 'boolean') return Boolean(val);
	return val;
};

const getDbInstance = async (tableName, tableConfig, connEndpoint = config.endpoints.mysql) => {
	// const userName = connEndpoint.split('//')[1].split(':')[0];
	// const hostPort = connEndpoint.split('@')[1].split('/')[0];
	// const connPoolKey = [userName, hostPort].join('@');
	const connPoolKeyTable = `${connEndpoint}/${tableName}`;

	if (!connectionPool[connEndpoint]) {
		connectionPool[connEndpoint] = await createDb(connEndpoint);
	}

	const knex = connectionPool[connEndpoint];

	if (!tablePool[connPoolKeyTable]) {
		await loadSchema(knex, tableName, tableConfig);
		tablePool[connPoolKeyTable] = true;
	}

	const { schema } = tableConfig;

	const upsert = async (inputRows) => {
		let rawRows = inputRows;
		if (!Array.isArray(rawRows)) rawRows = [inputRows];

		const rows = [];
		rawRows.forEach(item => {
			const row = {};
			Object.keys(schema).forEach(o => {
				row[o] = cast(item[o], schema[o].type);
			});
			rows.push(row);
		});

		try {
			const chunkSize = 1000;
			const ids = await knex.batchInsert(tableName, rows, chunkSize);
			logger.debug(`${rows.length} row(s) inserted/updated in '${tableName}' table`);
			return ids;
		} catch (error) {
			const errCode = error.code;
			const errMessage = error.message.split(`${errCode}: `)[1] || error.message;
			const errCause = errMessage.split(': ')[0];
			logger.debug('Encountered error with batch insert:', errCause,
				'\nRe-attempting to update/merge the conflicted transactions one at a time: ');

			return knex.transaction(async trx => {
				// TODO: Consider replacing promise all to Bluebird
				const inserts = await Promise.all(rows.map(row => trx(tableName).insert(row).onConflict('id').merge()
					.transacting(trx)));
				logger.debug(`${rows.length} row(s) inserted/updated in '${tableName}' table`);
				return inserts;
			});
		}
	};

	const find = async (params, columns) => {
		// TODO: Remove after PouchDB specific code is removed from the shared layer
		if (params.selector) params = params.selector;

		const limit = params.limit || 1;
		const offset = params.offset || 0;

		delete params.limit;
		delete params.offset;

		let res;
		if (params.propBetween) {
			const { propBetween } = params;
			delete params.propBetween;
			res = await knex.select(columns).table(tableName)
				.whereBetween(propBetween.property, [propBetween.from, propBetween.to]);
		} else if (params.sort) {
			const [sortProp, sortOrder] = params.sort.split(':');
			delete params.sort;
			res = await knex.select(columns)
				.table(tableName)
				.where(params)
				.orderBy(sortProp, sortOrder)
				.limit(limit)
				.offset(offset);
		} else {
			res = await knex.select(columns)
				.table(tableName)
				.where(params)
				.limit(limit)
				.offset(offset);
		}
		return res;
	};

	// const findById = async (id) => find({ id });

	// const findOneByProperty = async (property, value) => {
	// 	const params = {};
	// 	params[property] = value;
	// 	return find(params);
	// };

	// const deleteByProperty = async (property, value) => {
	// 	const whereParams = {};
	// 	whereParams[property] = value;
	// 	return knex(tableName).where(whereParams).del();
	// };

	// const deleteById = async (id) => deleteByProperty({ id });

	// const deleteBatch = async (rows) => {
	// 	if (rows instanceof Array && rows.length === 0) return null;
	// 	return knex(tableName).delete().whereIn('id', rows.map(row => row.id));
	// };

	// const getCount = async () => knex(tableName).count({ count: 'id' });

	return {
		upsert,
		find,
		// delete,
		// getCount,
	};
};

module.exports = getDbInstance;