import { Client, credentials, status } from "@grpc/grpc-js";
import * as proto from "@hashgraph/proto";
import Channel from "./Channel";

/**
 * @property {?proto.CryptoService} _crypto
 * @property {?proto.SmartContractService} _smartContract
 * @property {?proto.FileService} _file
 * @property {?proto.FreezeService} _freeze
 * @property {?proto.ConsensusService} _consensus
 * @property {?proto.NetworkService} _network
 */
export default class NodeChannel extends Channel {
    /**
     * @param {string} address
     */
    constructor(address) {
        super(address);

        /**
         * @type {Client}
         * @private
         */
        this._client = new Client(address, credentials.createInsecure());
    }

    /**
     * @returns {proto.CryptoService}
     */
    get crypto() {
        if (this._crypto != null) {
            return this._crypto;
        }

        this._crypto = proto.CryptoService.create(
            this._createUnaryRequester("CryptoService")
        );

        return this._crypto;
    }

    /**
     * @returns {proto.SmartContractService}
     */
    get smartContract() {
        if (this._smartContract != null) {
            return this._smartContract;
        }

        this._smartContract = proto.SmartContractService.create(
            this._createUnaryRequester(proto.SmartContractService.name)
        );

        return this._smartContract;
    }

    /**
     * @returns {proto.FileService}
     */
    get file() {
        if (this._file != null) {
            return this._file;
        }

        this._file = proto.FileService.create(
            this._createUnaryRequester(proto.FileService.name)
        );

        return this._file;
    }

    /**
     * @returns {proto.ConsensusService}
     */
    get consensus() {
        if (this._consensus != null) {
            return this._consensus;
        }

        this._consensus = proto.ConsensusService.create(
            this._createUnaryRequester(proto.ConsensusService.name)
        );

        return this._consensus;
    }

    /**
     * @returns {proto.FreezeService}
     */
    get freeze() {
        if (this._freeze != null) {
            return this._freeze;
        }

        this._freeze = proto.FreezeService.create(
            this._createUnaryRequester(proto.FreezeService.name)
        );

        return this._freeze;
    }

    /**
     * @returns {proto.NetworkService}
     */
    get network() {
        if (this._network != null) {
            return this._network;
        }

        this._network = proto.NetworkService.create(
            this._createUnaryRequester(proto.NetworkService.name)
        );

        return this._network;
    }

    /**
     * @param {string} serviceName
     * @returns {import("protobufjs").RPCImpl}
     * @private
     */
    _createUnaryRequester(serviceName) {
        return (method, requestData, callback) => {
            this._client.makeUnaryRequest(
                `/proto.${serviceName}/${method.name}`,
                (value) => value,
                (value) => value,
                Buffer.from(requestData),
                callback
            );
        };
    }

    /**
     * Cannot make this a simple getter becasue the call within the `create()`
     * needs to save the request handle to `SubscriptionHandle`
     *
     * @param {import("../topic/SubscriptionHandle").default} handle
     * @returns {proto.MirrorConsensusService}
     */
    mirror(handle) {
        return proto.MirrorConsensusService.create(
            (method, requestData, callback) => {
                const request = this._client
                    .makeServerStreamRequest(
                        // Note that for `MirrorConsensusService` the name is `ConsensusService`
                        `/com.hedera.mirror.api.proto.ConsensusService/${method.name}`,
                        (value) => value,
                        (value) => value,
                        Buffer.from(requestData)
                    )
                    .on("close", function () {
                        // Do nothing
                    })
                    .on("end", function () {
                        // Do nothing
                    })
                    .on("error", function () {
                        // Do nothing
                    })
                    .on("data", (message) => {
                        callback(null, message);
                    })
                    .on("status", (currentStatus) => {
                        // Only propagate the error if it is `NOT_FOUND` or `UNAVAILABLE`
                        // Otherwise finish here
                        if (
                            currentStatus.code === status.NOT_FOUND ||
                            currentStatus.code === status.UNAVAILABLE
                        ) {
                            callback(new Error(currentStatus.code.toString()));
                        }
                    });

                handle._setCall(() => request.cancel());
            }
        );
    }
}