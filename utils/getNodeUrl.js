const surfboardConfig = require("../surfboard.config.json")

const getNodeUrl = () => {
	const { defaultEnv } = surfboardConfig
	const nodeUrl = surfboardConfig.envs[defaultEnv].API_BASE

	return nodeUrl
}

module.exports = getNodeUrl
