const { MANGA, MANGA_733 } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const {
  suagent,
  escapeSpecChart,
  getIdByLastItem,
  transUrlId,
  addHttp,
} = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA
const showType = MANGA_733

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType
exports.search = (searchval = '') => {
  var url = `${HOST}/statics/search.aspx`
  return new Promise((resolve, reject) => {
    suagent(url, {
      setMap: {
        referer: HOST,
      },
      data: {
        key: searchval,
        button: '搜索',
      },
    })
      .then(({ text }) => {
        // console.log(text)
        const $ = cheerio.load(text)
        var $as = $('.cy_list_mh').find('ul')

        var list = []
        for (let i = 0, len = $as.length; i < len; i++) {
          var $item = $as.eq(i).find('.pic')
          // console.log($item.find('img').attr('src'))
          list.push({
            id: transUrlId($item.attr('href')),
            name: escapeSpecChart($item.find('img').attr('alt')),
            cover: addHttp($item.find('img').attr('src')),
            // cover: $item.find('.thumbnail').find('img').attr('style').match(/\(.+\)/ig)[0].replace(/\(|\)|\"|\"/ig, ''),
          })
        }

        resolve({
          list,
        })
      })
      .catch((err) => {
        reject(err)
        // intor();
      })
  })
}

// 推荐列表
