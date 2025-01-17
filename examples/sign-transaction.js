import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    AccountId,
    KeyList,
    TransferTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

let user1Key;
let user2Key;

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

    user1Key = PrivateKey.generate();
    user2Key = PrivateKey.generate();

    // create a multi-sig account
    const keyList = new KeyList([user1Key, user2Key]);

    const createAccountTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(2)) // 5 h
        .setKey(keyList);

    const response = await createAccountTransaction.executeWithSigner(wallet);

    let receipt = await response.getReceiptWithSigner(wallet);

    console.log(`account id = ${receipt.accountId.toString()}`);

    // create a transfer from new account to 0.0.3
    const transferTransaction = await new TransferTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .addHbarTransfer(receipt.accountId, -1)
        .addHbarTransfer("0.0.3", 1)
        .freezeWithSigner(wallet);

    user1Key.signTransaction(transferTransaction);
    user2Key.signTransaction(transferTransaction);

    const result = await transferTransaction.executeWithSigner(wallet);
    receipt = await result.getReceiptWithSigner(wallet);

    console.log(receipt.status.toString());
}

void main();
