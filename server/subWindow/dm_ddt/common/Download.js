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
  forEachRerverse$list,
  linkResourceisOk,
  getIdByLastItem,
  execFnloop,
  comVideoFunc,
  addHttp,
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
    this.getListUrl = HOST + '/down/' + this.id + '.html'
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

    // const name = escapeSpecChart($('.book_newtitle').text());
    const list = []
    const $as = $('.details-con2').find('div.details-con2-body')
    const $namelis = $('.details-con2 .play_list ul.playurl').eq(0).find('li')

    forEach$list($as, ($it, idx) => {
      let tempMap = {
        // name: '线路'+(idx+1),
        name: escapeSpecChart($namelis.eq(idx).find('a').text()),
        unclearTotal: true,
        arr: [],
      }
      // tempMap.name = '线路'
      // let tempList = [];
      let map = {}

      forEach$list($it.find('.details-con2-list').find('li'), ($li) => {
        const $a = $li.find('a')
        if ($li.hasClass('btn')) {
          return
        }
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
    let refuri = `${HOST}/play/${urlAsId}.html`
    return new Promise((resolve) => {
      execFnloop((next, count) => {
        suagent(refuri)
          .then((res) => {
            const $ = cheerio.load(res.text)
            const iframeSrc = $('iframe').attr('src')
            let m3u8uri = iframeSrc.split('?url=')[1]
            if (m3u8uri) {
              console.log(this.showType, 'm3u8uri', m3u8uri)
              resolve(decodeURIComponent(m3u8uri))
            } else {
              //有可能是页面里得数据
              execFnloop((inext, icount) => {
                suagent(iframeSrc)
                  .then((res) => {
                    let purl = ''
                    const $ = cheerio.load(res.text)
                    // hlsjsConfig
                    forEachRerverse$list($('script'), ($s) => {
                      let html = $s.html()
                      if (html.indexOf('new DPlayer') != -1) {
                        purl = parseExec(html, iframeSrc)

                        return false
                      }
                    })
                    console.log(this.showType, 'purl', purl)
                    resolve(purl)
                  })
                  .catch(() => {
                    if (icount > 10) {
                      resolve()
                      return
                    }
                    inext()
                  })
              })
            }
            console.log(this.showType, 'refuri', refuri)
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

// 获取下载地址
function parseExec(html, iframeSrc) {
  let videoMaxUrl = ''
  var params = {
    video: {},
  }
  var { $, document } = comVideoFunc()
  function DPlayer(p) {
    params = p
  }
  eval(html)
  console.log(params)
  let uriml
  if (params.video.url) {
    const a = new URL(params.video.url, iframeSrc)
    uriml = a.toString()
  }
  // console.log('videoMaxUrl', params)
  return uriml
}

module.exports = Download
