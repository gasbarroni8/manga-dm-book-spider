/*
 * @author: neos55555
 */
const superagent = require('superagent')
const fs = require('fs')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {
  getHeaderCookie,
  escapeSpecChart,
  suagent,
  forEach$list,
  linkResourceisOk,
  getIdByLastItem,
  execFnloop,
  addHttp,
  forEachRerverse$list,
  deTransUrlId,
  transUrlId,
  comVideoFunc,
  cookieToStr,
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
    this.disableTLSCerts = true
    // this
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex)
  }
  execList(text, res) {
    this.lastRealCookie = getHeaderCookie(res.headers['set-cookie'], true)
    const $ = cheerio.load(text)
    let listurl = ''
    forEachRerverse$list($('script'), ($s) => {
      let html = $s.html()
      if (html.indexOf("$('#url').load") != -1) {
        listurl = getFnListUrl(html)

        return false
      }
    })
    console.log('listurl', listurl)
    return suagent(listurl, {
      setMap: {
        cookie: cookieToStr(this.lastRealCookie),
      },
    }).then((res) => this.getExecList(res.text))
  }
  // 解析列表并返回
  getExecList(text) {
    const $ = cheerio.load(text)

    // const name = escapeSpecChart($('.book_newtitle').text());
    const list = []
    const $as = $('#play').find('.player')
    const $namelis = $('#play').find('.py-tabs').find('li')

    forEach$list($as, ($it, idx) => {
      let tempMap = {
        // name: '线路'+(idx+1),
        name: escapeSpecChart($namelis.eq(idx).text()),
        unclearTotal: true,
        arr: [],
      }
      // tempMap.name = '线路'
      // let tempList = [];
      let map = {}

      forEach$list($it.find('li'), ($li) => {
        const $a = $li.find('a')

        let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/gi, ''))
        if (map[title] !== undefined) {
          map[title]++
          title += map[title]
        } else {
          map[title] = 0
        }
        tempMap.arr.push({
          url: transUrlId($a.attr('href')),
          title,
          // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
        })
        // tempMap.arr.push(outerArr)
      })
      list.push(tempMap)
    })
    console.log(list)
    const obj = {
      // downloadLine: getMgData([this.id, 'downloadLine']) || 0,
      // id: that.id,
      // name,
      unclearTotal: true,
      list: list.filter((it) => it.arr.length != 0),
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

    let refuri = `${HOST}/${deTransUrlId(urlAsId)}`
    console.log(this.showType, 'refuri', refuri)
    return new Promise((resolve) => {
      execFnloop((next, icount) => {
        suagent(refuri, {
          setMap: {
            referer: this.getListUrl,
          },
          // disableTLSCerts: true,
        })
          .then((res) => {
            // console.log('mmmmmmm', res.text);
            const $ = cheerio.load(res.text)
            let p = ''
            forEachRerverse$list($('script'), ($s) => {
              let html = $s.html()
              if (html.indexOf('new DPlayer') != -1) {
                p = parseExec(html)

                return false
              }
            })
            resolve(p)
            // return p;
          })
          .catch((err) => {
            console.log(err)
            if (icount > 10) {
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

// 获取下载地址
function parseExec(html) {
  const [prevHtml] = html.split('new Date')
  // console.log('prevHtml', prevHtml);
  let videoMaxUrl = ''
  var { $, document } = comVideoFunc()
  function geturl(url) {
    videoMaxUrl = url
  }
  var DPlayer = function (p) {
    params = p
    this.on = function () {}
    this.notice = function () {}
    this.addEventListener = function () {}
  }
  eval(prevHtml + '10')
  console.log('videoMaxUrl', videoMaxUrl)
  return videoMaxUrl
}

//
function getFnListUrl(text) {
  // console.log(text);
  let map = {}
  var $ = function (key) {
    return {
      load(m) {
        map[key] = m
      },
    }
  }
  eval(text)
  return HOST + map['#url']
}

module.exports = Download
