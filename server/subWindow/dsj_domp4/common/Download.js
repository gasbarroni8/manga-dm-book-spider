/*
 * @author: neos55555
 */
const superagent = require('superagent')
const fs = require('fs')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {
  selfmkdir,
  escapeSpecChart,
  suagent,
  forEach$list,
  linkResourceisOk,
  getIdByLastItem,
  execFnloop,
  addHttp,
  forEachRerverse$list,
  deTransUrlId,
  comVideoFunc,
} = require('../../../lib')
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  showType,
} = require('./function.js')
const { HOST } = require('./comData')
// const url = require('url')

const TIMEOUT = 55000
// 如果使用pipe，当页面视频还未下载完时，就推出，那么下次检测就会把未下载完的当成已下载

class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id) // 这个是漫画目录
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.isDmType = true
    this.downloadAllList = []
    this.getListUrl = HOST + '/' + deTransUrlId(this.id) + '.html'
    this.savePicList = true // 因为这个网站的地址随时都要变更，每次获取都不一样，所以不得不这样做
    this.lastRealCookie = {}
    // this
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex)
  }

  // 解析列表并返回
  execList(text) {
    const that = this

    const $ = cheerio.load(text)
    // const $wrapper = $('.article-related.play_url')
    // const name = escapeSpecChart($('.book_newtitle').text());
    const list = []
    const $as = $('.article-related.play_url')

    forEach$list($as, ($it, idx) => {
      let tempMap = {
        // name: '线路'+(idx+1),
        name: escapeSpecChart($it.find('h2').text()),
        unclearTotal: true,
        arr: [],
      }
      // tempMap.name = '线路'
      // let tempList = [];
      let map = {}

      forEach$list($it.find('.play-list').find('li'), ($li) => {
        const $a = $li.find('a')
        /* if ($li.hasClass('btn')) {
					return;
				} */
        let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/gi, ''))
        if (map[title] !== undefined) {
          map[title]++
          title += map[title]
        } else {
          map[title] = 0
        }
        tempMap.arr.push({
          url: getIdByLastItem($a.attr('href')).replace('.html', ''),
          title,
          // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
        })
        // tempMap.arr.push(outerArr)
      })
      list.push(tempMap)
    })

    // console.log(getMgData([this.id, 'downloadLine']))
    const obj = {
      // downloadLine: getMgData([this.id, 'downloadLine']) || 0,
      // id: that.id,
      // name,
      unclearTotal: true,
      list,
    }

    return obj
  }

  getMaxPageCount({ url }, pageIndex) {
    return this.getVideoList(url, pageIndex, this.getTempSetMap({ url })).then(
      (picList) => {
        // this.list[this.downloadLine].arr[pageIndex].picList = picList;
        this.setConfigListItem(pageIndex, 'picList', picList)
        return picList.length
      }
    )
  }
  getTempSetMap({ url: urlAsId }) {
    return {
      referer: `${HOST}`,
      // cookie: cookieToStr(this.lastRealCookie)
      // cookie: 'fa_c=1; fa_t='+(Date.now() - 178665)+'; t1='+Date.now()+'; t2='+(Date.now() + 7100)+';'
    }
  }
  // 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址
  getVideoBigAddress(urlAsId, pageIndex) {
    // let ma = urlAsId.split('_')
    let that = this

    // let shtype = this.getListItem(pageIndex).type;
    // console.log('当前视频的格式', shtype, pageIndex);
    // this.lastRealCookie = {};
    // https://www.doudoudm.site/Home/Index/html5/52635.html
    let refuri = `${HOST}/guankan/${urlAsId}.html`
    return new Promise((resolve) => {
      execFnloop((next, count) => {
        suagent(refuri)
          .then((res) => {
            const $ = cheerio.load(res.text)
            let iframeSrc = $('iframe').attr('src')
            iframeSrc = addHttp(iframeSrc, HOST)
            // resolve(iframeSrc)
            console.log(this.showType, '当前的iframe地址是', iframeSrc)
            execFnloop((inext, icount) => {
              suagent(iframeSrc)
                .then((rs) => {
                  const $ = cheerio.load(rs.text)

                  let params = { video: {} }
                  forEachRerverse$list($('script'), ($s) => {
                    let html = $s.html()
                    console.log(html.indexOf('function init') != -1)
                    if (html.indexOf('function init') != -1) {
                      params = parseExec(html)
                      // console.log(this.showType, '观看参数？？？？难道没进来么', params)
                      return false
                    }
                  })
                  console.log(this.showType, '观看参数', params)

                  resolve(params.video.url)
                })
                .catch((err) => {
                  console.log(this.showType, '在获取iframe内容时报错', err)
                  if (icount > 10) {
                    resolve()
                    return
                  }
                  inext()
                })
            })
          })
          .catch(() => {
            if (count > 10) {
              resolve()
              return
            }
            next()
          })
      })
    })
  }

  // 下载当前这一个
}

function parseExec(html) {
  var { $, document } = comVideoFunc()

  var params = {
    video: {},
  }
  var DPlayer = function (p) {
    params = p
    this.on = function () {}
    this.notice = function () {}
    this.addEventListener = function () {}
  }
  // console.log(html)
  // try {
  eval(html)
  params.video.pic = null

  // } catch (e) {

  // }
  return params
}

module.exports = Download
