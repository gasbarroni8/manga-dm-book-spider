const { DONGMAN, DM_FZDM } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const {
  suagent,
  escapeSpecChart,
  getIdByLastItem,
  execUrlParams,
  addHttp,
} = require('../../../lib')
// const superagent = require('superagent')

const bigType = DONGMAN
const showType = DM_FZDM

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType
exports.search = (searchval = '', page = 1) => {
  var url = `${HOST}/search.php?searchword=${encodeURI(
    searchval
  )}&searchtype=&page=${page}`
  return suagent(url, {
    setMap: {
      Referer: HOST,
    },
  }).then(({ text }) => {
    const $ = cheerio.load(text)
    const $wrapper = $('.my-content')
    const $lis = $wrapper.find('.video-contain').find('li')
    const list = []
    // console.log(text)
    for (let i = 0, len = $lis.length; i < len; i++) {
      const $item = $lis.eq(i)

      const $tmp = $item.find('.videopic')
      // let name = escapeSpecChart($item.find('.detail a').text())

      let id = getIdByLastItem($tmp.attr('href')).replace('.html', '')
      list.push({
        id,
        name: escapeSpecChart($tmp.attr('title')),
        cover: addHttp($tmp.attr('data-original'), HOST),
      })
    }
    let $mars = $wrapper.find('.page-wrap').find('li')
    let total =
      parseInt(
        execUrlParams(
          $mars
            .eq($mars.length - 1)
            .find('a')
            .attr('href')
        ).page
      ) || 0
    console.log(list)
    return {
      list,
      total: total * 10,
    }
  })
}

// 推荐列表
