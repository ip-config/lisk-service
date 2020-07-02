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
const config = {
	log: {},
};

/**
 * Gateway socket configuration
 */
config.port = process.env.PORT || 3011;
config.host = process.env.HOST || '0.0.0.0';

/**
 * Inter-service message broker
 */
config.transporter = process.env.SERVICE_BROKER || 'redis://localhost:6379';
config.brokerTimeout = Number(process.env.SERVICE_BROKER_TIMEOUT) || 30; // in seconds

/**
 * Inter-service message broker
 */
config.apis = [
	{
		name: 'http-test',
		description: 'Test API',
		enabled: false,
		apiPath: '/api/test',
	},
	{
		name: 'http-version1',
		description: 'Version 1 API',
		enabled: true,
		apiPath: '/api/v1',
	},
	{
		name: 'socketio-jsonrpc-version1',
		description: 'Socket.io API',
		enabled: true,
		apiPath: '/rpc',
	},
	{
		name: 'socketio-blockchain-updates',
		description: 'Socket.io API',
		enabled: true,
		apiPath: '/blockchain',
	},
];

/**
 * LOGGING
 *
 * log.level   - TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK
 * log.console - Plain JavaScript console.log() output (true/false)
 * log.stdout  - Writes directly to stdout (true/false)
 * log.file    - outputs to a file (ie. ./logs/app.log)
 * log.gelf    - Writes to GELF-compatible socket (ie. localhost:12201/udp)
 */
config.log.level = process.env.SERVICE_LOG_LEVEL || 'info';
config.log.console = process.env.SERVICE_LOG_CONSOLE || 'false';
config.log.stdout = process.env.SERVICE_LOG_STDOUT || 'true';
config.log.gelf = process.env.SERVICE_LOG_GELF || 'false';
config.log.file = process.env.SERVICE_LOG_FILE || 'false';
config.log.docker_host = process.env.DOCKER_HOST || 'local';
config.debug = process.env.SERVICE_LOG_LEVEL === 'debug';

module.exports = config;