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
const config = require('../../../config');
const { request } = require('../../../helpers/socketIoRpcRequest');

const {
	invalidParamsSchema,
	jsonRpcEnvelopeSchema,
	metaSchema,
} = require('../../../schemas/rpcGenerics.schema');

const {
	emptyResponseSchema,
	emptyResultEnvelopeSchema,
	peerSchema,
} = require('../../../schemas/peer.schema');

const wsRpcUrl = `${config.SERVICE_ENDPOINT}/rpc-v1`;
const requestPeers = async params => request(wsRpcUrl, 'get.peers', params);

describe('get.peers', () => {
	it('is able to receive data', async () => {
		const response = await requestPeers({ state: 'connected' });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result.data).toBeInstanceOf(Array);
		expect(result.data.length).toBeGreaterThanOrEqual(1);
		result.data.forEach(peer => expect(peer).toMap(peerSchema));
		expect(result.meta).toMap(metaSchema);
	});

	it('invalid type fails', async () => {
		const error = await requestPeers({ ip: 0 });
		expect(error).toMap(invalidParamsSchema);
	});

	it('invalid IP string returns empty list', async () => {
		const response = await requestPeers({ ip: '0' });
		expect(response).toMap(emptyResponseSchema);
		const { result } = response;
		expect(result).toMap(emptyResultEnvelopeSchema);
	});

	it('non-existent IP returns empty', async () => {
		const response = await requestPeers({ ip: '256.256.256.256' });
		expect(response).toMap(emptyResponseSchema);
		const { result } = response;
		expect(result).toMap(emptyResultEnvelopeSchema);
	});

	it('non-existent HTTP port returns empty', async () => {
		const response = await requestPeers({ httpPort: 70000000 });
		expect(response).toMap(invalidParamsSchema);
	});

	it('non-existent WebSocket port returns empty', async () => {
		const response = await requestPeers({ wsPort: 70000000 });
		expect(response).toMap(invalidParamsSchema);
	});

	it('non-existent version returns empty', async () => {
		const response = await requestPeers({ os: 'linux4.4.0-134-generic0000000' });
		expect(response).toMap(emptyResponseSchema);
		const { result } = response;
		expect(result).toMap(emptyResultEnvelopeSchema);
	});

	xit('non-existent version fails', async () => {
		const response = await requestPeers({ version: null });
		expect(response).toMap(emptyResponseSchema);
		const { result } = response;
		expect(result).toMap(emptyResultEnvelopeSchema);
	});

	it('wrong state fails', async () => {
		const response = await requestPeers({ state: 3 });
		expect(response).toMap(invalidParamsSchema);
	});

	it('non-existent height returns empty', async () => {
		const response = await requestPeers({ height: 1000000000 });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		expect(response.result).toMap(emptyResultEnvelopeSchema);
	});

	it('non-existent broadhash returns empty', async () => {
		const response = await requestPeers({ broadhash: 'bf8b9d02a2167933be8c4a22b90992aee55204dca4452b3844208754a3baeb7b000000' });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		expect(response.result).toMap(emptyResultEnvelopeSchema);
	});

	it('valid limit and offset works', async () => {
		const limit = 2;
		const response = await requestPeers({ limit, offset: 3 });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result.data).toBeInstanceOf(Array);
		expect(result.data.length).toEqual(limit);
		result.data.forEach(peer => expect(peer).toMap(peerSchema));
		expect(result.meta).toMap(metaSchema);
	});

	it('too small limit fails', async () => {
		const response = await requestPeers({ limit: 0 });
		expect(response).toMap(invalidParamsSchema);
	});

	xit('too big limit fails', async () => {
		const response = await requestPeers({ limit: 101 });
		expect(response).toMap(invalidParamsSchema);
	});

	it('invalid offset fails', async () => {
		const response = await requestPeers({ state: 'connected', offset: null });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result.data).toBeInstanceOf(Array);
		expect(result.data.length).toBeGreaterThanOrEqual(1);
		result.data.forEach(peer => expect(peer).toMap(peerSchema));
		expect(result.meta).toMap(metaSchema);
	});

	it('big offset returns empty', async () => {
		const response = await requestPeers({ offset: 1000000 });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		expect(response.result).toMap(emptyResultEnvelopeSchema);
	});

	it('empty sort returns data properly', async () => {
		const response = await requestPeers({ state: 'connected', sort: '' });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result.data).toBeInstanceOf(Array);
		expect(result.data.length).toBeGreaterThanOrEqual(1);
		result.data.forEach(peer => expect(peer).toMap(peerSchema));
		expect(result.meta).toMap(metaSchema);
	});

	it('invalid sort fails', async () => {
		const response = await requestPeers({ sort: 'height:ascc' });
		expect(response).toMap(invalidParamsSchema);
	});
});
