const { ensureLogin } = require('./utils/api')
App({ onLaunch() { ensureLogin().catch(() => {}) } })
