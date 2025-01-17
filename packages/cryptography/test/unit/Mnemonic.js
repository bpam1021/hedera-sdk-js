import Mnemonic from "../../src/Mnemonic.js";
import BadMnemonicError from "../../src/BadMnemonicError.js";
import BadMnemonicReason from "../../src/BadMnemonicReason.js";

describe("Mnemonic", function () {
    it("should generate 24 words", async function () {
        const m = await Mnemonic.generate();

        expect(m.words).to.have.length(24);

        // noinspection JSAccessibilityCheck
        await m._validate();
    });

    it("should generate 12 words", async function () {
        const m = await Mnemonic.generate12();

        expect(m.words).to.have.length(12);

        // noinspection JSAccessibilityCheck
        await m._validate();
    });

    it("12 words from string", async function () {
        const m = await Mnemonic.fromString(
            "spy,base,tired,useless,rug,riot,ticket,enroll,disorder,kiwi,client,impulse"
        );

        expect(m.words).to.have.length(12);

        // noinspection JSAccessibilityCheck
        await m._validate();
    });

    it("should detect an invalid checksum", async function () {
        const m = await Mnemonic.generate();

        // swap words so the checksum will be invalid
        m.words[m.words.length - 1] = m.words[0];

        await Mnemonic.fromWords(m.words).catch((err) => {
            expect(err).to.be.instanceOf(BadMnemonicError);
            expect(err.reason).to.eql(BadMnemonicReason.ChecksumMismatch);
        });
    });

    it("should produce the expected private key", async function () {
        // generated by [hedera-keygen-java], not used anywhere
        const mnemonic = await Mnemonic.fromString(
            "inmate flip alley wear offer often piece magnet surge toddler submit right radio absent pear floor belt raven price stove replace reduce plate home"
        );

        const expectedKey =
            "302e020100300506032b657004220420853f15aecd22706b105da1d709b4ac05b4906170c2b9c7495dff9af49e1391da";

        const key = await mnemonic.toPrivateKey();

        expect(key.toString()).to.eql(expectedKey);
    });

    it("should produce the expected legacy private key", async function () {
        // root key generated by the iOS wallet, not used anywhere
        const legacyMnemonic = await Mnemonic.fromString(
            "jolly,kidnap,Tom,lawn,drunk,chick,optic,lust,mutter,mole,bride,galley,dense,member,sage,neural,widow,decide,curb,aboard,margin,manure"
        );

        expect(legacyMnemonic.words).to.have.length(22);

        const expectedLegacyKey =
            "302e020100300506032b657004220420882a565ad8cb45643892b5366c1ee1c1ef4a730c5ce821a219ff49b6bf173ddf";

        expect(
            (
                await (await legacyMnemonic.toPrivateKey()).legacyDerive(-1)
            ).toString()
        ).to.eql(expectedLegacyKey);
    });

    it("legacy2 mnemonic should work", async function () {
        const legacyMnemonic = await Mnemonic.fromString(
            "obvious,favorite,remain,caution,remove,laptop,base,vacant,increase,video,erase,pass,sniff,sausage,knock,grid,argue,salt,romance,way,alone,fever,slush,dune"
        );
        const legacyPrivateKey = await (
            await legacyMnemonic.toLegacyPrivateKey()
        ).legacyDerive(0);

        const expectedLegacyKey =
            "302e020100300506032b6570042204202b7345f302a10c2a6d55bf8b7af40f125ec41d780957826006d30776f0c441fb";

        expect(legacyPrivateKey.toString()).to.eql(expectedLegacyKey);
    });

    it("should match MyHbarWallet v1", async function () {
        let mnemonic;

        try {
            mnemonic = await Mnemonic.fromString(
                "jolly kidnap Tom lawn drunk chick optic lust mutter mole bride galley dense member sage neural widow decide curb aboard margin manure"
            );
        } catch (err) {
            if (err instanceof BadMnemonicError) {
                mnemonic = err.mnemonic;
            } else {
                throw err;
            }
        }

        const rootPrivateKey = await mnemonic.toLegacyPrivateKey();
        const privateKeyMhw = await rootPrivateKey.legacyDerive(1099511627775);

        expect(privateKeyMhw.publicKey.toString()).to.eql(
            "302a300506032b657003210045f3a673984a0b4ee404a1f4404ed058475ecd177729daa042e437702f7791e9"
        );
    });

    it("should match hedera-keygen-java for a 22-word legacy phrase", async function () {
        const mnemonic = await Mnemonic.fromString(
            "jolly,kidnap,tom,lawn,drunk,chick,optic,lust,mutter,mole,bride,galley,dense,member,sage,neural,widow,decide,curb,aboard,margin,manure"
        );

        const rootPrivateKey = await mnemonic.toLegacyPrivateKey();

        const privateKey0 = await rootPrivateKey.legacyDerive(0);
        const privateKeyNeg1 = await rootPrivateKey.legacyDerive(-1);

        expect(privateKey0.toString()).to.eql(
            "302e020100300506032b657004220420fae0002d2716ea3a60c9cd05ee3c4bb88723b196341b68a02d20975f9d049dc6"
        );
        expect(privateKeyNeg1.toString()).to.eql(
            "302e020100300506032b657004220420882a565ad8cb45643892b5366c1ee1c1ef4a730c5ce821a219ff49b6bf173ddf"
        );
    });

    it("should match hedera-keygen-java for a 24-word legacy phrase", async function () {
        const mnemonic = await Mnemonic.fromString(
            "obvious,favorite,remain,caution,remove,laptop,base,vacant,increase,video,erase,pass,sniff,sausage,knock,grid,argue,salt,romance,way,alone,fever,slush,dune"
        );

        const rootPrivateKey = await mnemonic.toLegacyPrivateKey();

        const privateKey0 = await rootPrivateKey.legacyDerive(0);
        const privateKeyNeg1 = await rootPrivateKey.legacyDerive(-1);

        expect(privateKey0.toString()).to.eql(
            "302e020100300506032b6570042204202b7345f302a10c2a6d55bf8b7af40f125ec41d780957826006d30776f0c441fb"
        );
        expect(privateKeyNeg1.toString()).to.eql(
            "302e020100300506032b657004220420caffc03fdb9853e6a91a5b3c57a5c0031d164ce1c464dea88f3114786b5199e5"
        );
    });
});
