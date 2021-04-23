const comConstant = require('../com-constant')

Object.keys(comConstant).forEach((key) => {
  exports[key] = comConstant[key]
})

exports.READ_RECORD = 'readRecord'

exports.userAgentArr = require('./userAgentArr')
exports.appUserAgentArr = require('./appUserAgentArr')

// M3U8，最大下载量
exports.MAX_TS_DOWNLOAD_COUNT = 20
