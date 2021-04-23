const { BOOK, BOOK5X } = require('../../../constant')
const { suagent, escapeSpecChart } = require('../../../lib')
const { HOST } = require('./comData')
const cheerio = require('cheerio')

const bigType = BOOK
const showType = BOOK5X

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType

// 搜索
exports.search = function search(search, pageIndex = 1) {
  search = encodeURIComponent(search)
  // /search.html?searchkey=游戏王
  const url =
    pageIndex == 1
      ? `${HOST}/search.html?searchkey=${search}`
      : `${HOST}/search/result/searchtype/complex/searchkey/${search}/page/${pageIndex}`
  console.log(url)
  return suagent(url).then(({ text }) => {
    const $ = cheerio.load(text)
    const total =
      (parseInt($('.yemian').find('.pageinfo').find('strong').eq(1).text()) /
        20) *
      10
    // const total = ($('.yemian').find('.pageinfo').find('strong').eq(1).text())
    const $lis = $('.xiashu').find('ul')
    const list = []
    for (let i = 0, len = $lis.length; i < len; i++) {
      const $item = $lis.eq(i)
      let name = $item.find('.qq_g').text()
      let tempName = name.match(/《(.+)》/)[1]

      let id = $item.find('.qq_g').find('a').attr('href').split('/')
      // console.log(id)
      id = id[id.length - 1].replace(/txt|\.html/gi, '')
      list.push({
        id,
        author: $item.find('.qq_r').text().trim(),
        name: tempName ? escapeSpecChart(tempName) : escapeSpecChart(name),
      })
    }

    return {
      list,
      total,
    }
  })
}
