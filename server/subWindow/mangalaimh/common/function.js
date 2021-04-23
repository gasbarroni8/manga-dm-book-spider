const { MANGA, MANGA_LAIMH } = require('../../../constant')
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
const showType = MANGA_LAIMH

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType)

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key]
})

exports.bigType = bigType
exports.showType = showType
exports.search = (searchval = '') => {
  var url = `${HOST}/cse/search/`
  return new Promise((resolve, reject) => {
    suagent(
      'post',
      url,
      {
        setMap: {
          // cookie:
          // 'UM_distinctid=177ccb063d5457-0b9358087b0033-30614f07-1fa400-177ccb063d692e; CNZZDATA1276171765=230721405-1614042487-%7C1618185839; mh160searchid=63D14CEC6087C505C3365F6BE207F3E9; ASPSESSIONIDQGCSDDSS=EHNJLFJBBJHFENIDBHHFPEMN',
          referer: url,
          'content-type': 'application/x-www-form-urlencoded',
        },
        data: {
          key: searchval,
          button: '',
        },
      },
      true
    )
      .then(({ text }) => {
        // console.log(text)
        const $ = cheerio.load(text)
        var $as = $('#dmList').find('li')

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
