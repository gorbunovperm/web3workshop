/* global setupAccounts, accounts, compile, file, setScript, broadcast, waitForTx, invokeScript, address */
const assert = require("assert")
const { nodeInteraction } = require("@waves/waves-transactions")
const { toWavelets } = require("../utils/currency")
const getNodeUrl = require("../utils/getNodeUrl")

const nodeUrl = getNodeUrl()
const accountsConfig = {
	alice: toWavelets(10),
	bob: toWavelets(10),
}

describe("Notepad smart contract", function() {
	// Deploy contract
	before(async function() {
		this.timeout(100000)

		// Allocate funds to participants
		await setupAccounts(accountsConfig)

		// Construct the setScript tx
		const script = compile(file("notepad.ride"))
		const setScriptTx = setScript({ script }, accounts.alice)

		// Wait for tx confirmation
		await broadcast(setScriptTx)
		await waitForTx(setScriptTx.id)

		console.info(`Notepad contract has been deployed (${setScriptTx.id})\n`)
	})

	// Invoke @Callable writeNote function
	it("Bob can store a note to Alice's account state", async function() {
		const bobsNote = "Hello World!"
		const addressAlice = address(accounts.alice)
		const addressBob = address(accounts.bob)

		// Construct the invokeScript tx
		const invokeScriptTx = invokeScript(
			{
				dApp: addressAlice,
				call: { function: "writeNote", args: [{ type: "string", value: bobsNote }] },
			},
			accounts.bob,
		)

		// Wait for tx confirmation
		await broadcast(invokeScriptTx)
		await waitForTx(invokeScriptTx.id)

		// Fetch alice's account state
		const aliceAccountState = await nodeInteraction.accountData(addressAlice, nodeUrl)

		// Check if data was written successfully
		assert.equal(aliceAccountState[addressBob].value, bobsNote)

		console.info(
			`Bob successfully saved his note to Alice's account state (${invokeScriptTx.id})`,
		)
	})
})
