const argumentProcessor = require("./utils/ArgumentProcessor");

module.exports = {
    Subscription: require("./utils/Subscription"),
    argumentProcessor: require("./utils/argumentProcessor"),
    vec3ShadowHandler: require("./utils/vec3ShadowHandler"),
    eulerShadowHandler: require("./utils/eulerShadowHandler")
}