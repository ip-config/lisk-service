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
import Joi from 'joi';

const voteSchema = {
	address: Joi.string().required(),
	amount: Joi.string().optional(),
	publicKey: Joi.string().required(),
	balance: Joi.number().integer().min(1).required(),
	username: Joi.string().required(),
};

const metaSchema = {
	count: Joi.number().integer().min(0).required(),
	total: Joi.number().integer().min(0).required(),
	offset: Joi.number().integer().min(0).required(),
	address: Joi.string().required(),
	publicKey: Joi.string().required(),
	username: Joi.string().required(),
};

module.exports = {
	voteSchema: Joi.object(voteSchema).required(),
	metaSchema: Joi.object(metaSchema).required(),
	voteMetaSchema: Joi.object(metaSchema).required(),
};
