const { DONGMAN, DM_KDM } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const {
  suagent,
  escapeSpecChart,
  getIdByLastItem,
  execUrlParams,
} = require('../../../lib')
// const superagent = require('superagent')

const bigType = DONGMAN
const showType = DM_KDM

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType
exports.search = (searchval = '', page = 1) => {
  var url = `${HOST}/search.asp`
  console.log(url)
  return suagent(
    'post',
    url,
    {
      data: {
        searchword: searchval,
        submit: '搜索',
        page,
      },
      setMap: {
        Referer: HOST,
      },
    },
    true
  ).then(({ text }) => {
    const $ = cheerio.load(text)
    // console.log(typeof text)
    const $wrapper = $('.box700')
    const $lis = $wrapper.find('.movie-chrList').find('ul').find('li')
    const list = []
    console.log($lis.length)
    for (let i = 0, len = $lis.length; i < len; i++) {
      const $item = $lis.eq(i)

      const $tmp = $item.find('.cover a')
      // let name = escapeSpecChart($item.find('.detail a').text())

      let id = $tmp.attr('href').replace(/\//gi, '')
      list.push({
        id,
        name: escapeSpecChart($tmp.find('img').attr('alt')),
        cover: HOST + $tmp.find('img').attr('src'),
      })
    }
    let $mars = $wrapper.find('.pages').eq(0).find('span').eq(0).find('a')
    console.log(list)
    let total =
      parseInt(
        execUrlParams($mars.eq($mars.length - 1).attr('href') || '').page
      ) || 0
    console.log('11111')
    return {
      list,
      total: total * 10,
    }
  })
}

// 推荐列表
