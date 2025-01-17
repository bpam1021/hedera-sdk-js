import {
    AccountBalanceQuery,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    Wallet,
    LocalProvider,
    PrivateKey,
    Hbar,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenDeleteTransaction,
    TokenGrantKycTransaction,
    TransferTransaction,
    TokenWipeTransaction,
    TransactionId,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required."
        );
    }

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        new LocalProvider()
    );

    const newKey = PrivateKey.generate();

    console.log(`private key = ${newKey.toString()}`);
    console.log(`public key = ${newKey.publicKey.toString()}`);

    let resp = await new AccountCreateTransaction()
        .setKey(newKey.publicKey)
        .setInitialBalance(new Hbar(2))
        .executeWithSigner(wallet);

    const transactionReceipt = await resp.getReceiptWithSigner(wallet);
    const newAccountId = transactionReceipt.accountId;

    console.log(`account id = ${newAccountId.toString()}`);

    resp = await new TokenCreateTransaction()
        .setNodeAccountIds([resp.nodeId])
        .setTokenName("ffff")
        .setTokenSymbol("F")
        .setDecimals(3)
        .setInitialSupply(100)
        .setTreasuryAccountId(wallet.getAccountId())
        .setAdminKey(wallet.getAccountKey())
        .setFreezeKey(wallet.getAccountKey())
        .setWipeKey(wallet.getAccountKey())
        .setKycKey(wallet.getAccountKey())
        .setSupplyKey(wallet.getAccountKey())
        .setFreezeDefault(false)
        .executeWithSigner(wallet);

    const tokenId = (await resp.getReceiptWithSigner(wallet)).tokenId;
    console.log(`token id = ${tokenId.toString()}`);

    await (
        await (
            await (
                await new TokenAssociateTransaction()
                    .setNodeAccountIds([resp.nodeId])
                    .setAccountId(newAccountId)
                    .setTokenIds([tokenId])
                    .freezeWithSigner(wallet)
            ).sign(newKey)
        ).executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(
        `Associated account ${newAccountId.toString()} with token ${tokenId.toString()}`
    );

    await (
        await new TokenGrantKycTransaction()
            .setNodeAccountIds([resp.nodeId])
            .setAccountId(newAccountId)
            .setTokenId(tokenId)
            .executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(
        `Granted KYC for account ${newAccountId.toString()} on token ${tokenId.toString()}`
    );

    await (
        await new TransferTransaction()
            .setNodeAccountIds([resp.nodeId])
            .addTokenTransfer(tokenId, wallet.getAccountId(), -10)
            .addTokenTransfer(tokenId, newAccountId, 10)
            .executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(
        `Sent 10 tokens from account ${wallet
            .getAccountId()
            .toString()} to account ${newAccountId.toString()} on token ${tokenId.toString()}`
    );

    const balances = await new AccountBalanceQuery()
        .setAccountId(wallet.getAccountId())
        .executeWithSigner(wallet);

    console.log(
        `Token balances for ${wallet
            .getAccountId()
            .toString()} are ${balances.tokens.toString().toString()}`
    );

    await (
        await new TokenWipeTransaction()
            .setNodeAccountIds([resp.nodeId])
            .setTokenId(tokenId)
            .setAccountId(newAccountId)
            .setAmount(10)
            .executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(`Wiped balance of account ${newAccountId.toString()}`);

    await (
        await new TokenDeleteTransaction()
            .setNodeAccountIds([resp.nodeId])
            .setTokenId(tokenId)
            .executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(`Deleted token ${tokenId.toString()}`);

    await (
        await (
            await (
                await new AccountDeleteTransaction()
                    .setNodeAccountIds([resp.nodeId])
                    .setAccountId(newAccountId)
                    .setTransferAccountId(wallet.getAccountId())
                    .setTransactionId(TransactionId.generate(newAccountId))
                    .setMaxTransactionFee(new Hbar(1))
                    .freezeWithSigner(wallet)
            ).sign(newKey)
        ).executeWithSigner(wallet)
    ).getReceiptWithSigner(wallet);

    console.log(`Deleted account ${newAccountId.toString()}`);
}

void main();
