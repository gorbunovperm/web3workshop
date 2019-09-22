/* global setupAccounts, accounts, compile, file, setScript, broadcast, waitForTx, transfer, address, publicKey */
const { toWavelets } = require("../utils/currency")

// eslint-disable-next-line no-unused-vars
const printPublicKeys = (accounts = {}) => {
	const publicKeys = Object.entries(accounts).reduce(
		(publicKeys, [accountName, seed]) => ({
			...publicKeys,
			[accountName]: publicKey(seed),
		}),
		{},
	)

	console.table(publicKeys)
}

const nonce = "random" // Using a fixed nonce we can generate deterministic accounts
const accountsConfig = {
	alice: toWavelets(10),
	bob: toWavelets(10),
	cooper: toWavelets(10),
}

describe("2-of-3 multi signature contract", function() {
	// Deploy contract
	before(async function() {
		this.timeout(100000)

		// Allocate funds to participants
		await setupAccounts(accountsConfig, { nonce })
		// printPublicKeys(accounts) // Uncomment to view publicKeys of accounts

		// Construct the setScript tx
		const script = compile(file("multiSig.ride"))
		const setScriptTx = setScript({ script, fee: toWavelets(0.014) }, accounts.alice)

		// Wait for tx confirmation
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Smart contract has been deployed (${setScriptTx.id})\n`)
	})

	it("Transfers funds from Alice to Bob", async function() {
		const addressBob = address(accounts.bob)

		// Construct the transfer tx
		const transferTxSignedByAlice = transfer(
			{ amount: toWavelets(1), recipient: addressBob, fee: toWavelets(0.005) },
			accounts.alice,
		)
		// Add second signature from Bob
		const transferTxSignedByAliceAndBob = transfer(transferTxSignedByAlice, accounts.bob)

		// Wait for tx confirmation
		await broadcast(transferTxSignedByAliceAndBob)
		await waitForTx(transferTxSignedByAliceAndBob.id)

		console.info(
			`Successfully invoked a multi signature transfer signed by multiple parties (${transferTxSignedByAliceAndBob.id})`,
		)
	})
})
