const toWavelets = (waves = 0) => waves * 10 ** 8
const toWaves = (wavelets = 0) => wavelets / 10 ** 8

module.exports = {
	toWavelets,
	toWaves,
}
