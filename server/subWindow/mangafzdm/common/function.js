const { MANGA, MANGAFZDM } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart } = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA
const showType = MANGAFZDM

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType
exports.search = (searchval = '') => {
  var url = HOST
  return new Promise((resolve, reject) => {
    suagent(url)
      .then(({ text }) => {
        // console.log(res.text)
        var $ = cheerio.load(text)
        var $as = $('#mhmain ul').find('.round')
        // console.log($as.length)
        var list = []
        for (let i = 0, len = $as.length; i < len; i++) {
          var $item = $as.eq(i).find('li').eq(1).find('a')
          const name = escapeSpecChart($item.text())
          if (
            name.indexOf(searchval) !== -1 ||
            searchval.indexOf(name) !== -1
          ) {
            list.push({
              id: $item.attr('href').replace(/\//gi, ''),
              name,
              // cover: $item.find('img').attr('src'),	// 图片加载不了，所以干脆不加
            })
          }
        }
        // console.log(res.text)
        // return list;
        resolve({
          list,
          total: 0,
        })
      })
      .catch((err) => {
        // console.log(err)
        reject(err)
        // intor();
      })
  })
}
