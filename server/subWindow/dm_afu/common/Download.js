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
  cookieToStr,
  execUrlParams,
  linkResourceisOk,
  getHeaderCookie,
} = require('../../../lib')
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  showType,
} = require('./function.js')
const { HOST } = require('./comData')
const { parse } = require('path')
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
    this.getListUrl = HOST + '/detail/' + this.id
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

    let downloadLineTemp = parseInt($('#DEF_PLAYINDEX').html())
    // const name = escapeSpecChart($('.book_newtitle').text());
    const list = []
    // let tempList = [];
    const $as = $('#main0').find('.movurl')
    const $namelis = $('#menu0').find('li')

    let downloadLine = 0

    forEach$list($as, ($it, idx) => {
      if (downloadLineTemp == idx) {
        downloadLine = list.length
      }
      let tempMap = {
        // name: '线路'+(idx+1),
        name: escapeSpecChart($namelis.eq(idx).text()),
        unclearTotal: true,
        arr: [],
      }
      // tempMap.name = '线路'
      // let tempList = [];
      let map = {}
      let $lis = $it.find('ul').find('li')

      if ($lis.length == 0) {
        return
      }

      forEach$list($lis, ($li) => {
        const $a = $li.find('a')
        let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/gi, ''))
        if (map[title] !== undefined) {
          map[title]++
          title += map[title]
        } else {
          map[title] = 0
        }
        tempMap.arr.push({
          url: execUrlParams($a.attr('href')).playid,
          title,
          // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
        })
        // tempMap.arr.push(outerArr)
      })
      list.push(tempMap)
    })

    console.log('列表如下：', list)
    // console.log(getMgData([this.id, 'downloadLine']))
    const obj = {
      downloadLine,
      // downloadLine: getMgData([this.id, 'downloadLine']) || 0,
      // id: that.id,
      // name,
      unclearTotal: true,
      list,
    }
    this.downloadLine = downloadLine

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
      referer: `${HOST}/play/${this.id}?playid=${urlAsId}`,
      cookie: cookieToStr(this.lastRealCookie),
      // cookie: 'fa_c=1; fa_t='+(Date.now() - 178665)+'; t1='+Date.now()+'; t2='+(Date.now() + 7100)+';'
    }
  }
  // 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址
  getVideoBigAddress(urlAsId, pageIndex) {
    let ma = urlAsId.split('_')
    let that = this

    // let shtype = this.getListItem(pageIndex).type;
    // console.log('当前视频的格式', shtype, pageIndex);
    this.lastRealCookie = {}

    let refuri = `${HOST}/play/${that.id}?playid=${urlAsId}`
    return new Promise((resolve) => {
      function getTempCookie(rcookie = {}) {
        let dt = Date.now()
        return {
          // fa_c: 2,
          // fa_t: (dt - 178665 - parseInt(Math.random() * 2000)),
          t1: dt,
          t2: dt + 7100,
          ...rcookie,
        }
      }
      function getk2(t1) {
        // 这个是从__getplay_pc函数里来的
        var t1 = Math['round'](Number(t1) / 1000) >> 5
        return (t1 * (t1 % 4096) * 3 + 83215) * (t1 % 4096) + t1
      }
      let rand = Math.random()
      // 执行了多少次递归
      let icountIndex = 0

      ;(function intor(idx, cookie = {}) {
        if (idx >= 3) {
          rand = Math.random()
          console.log('就这么执行完3次了？')
          icountIndex++
          setTimeout(() => {
            if (icountIndex > 18) {
              console.log('重复获取18次了，所以直接结束')
              resolve()
              return
            }
            intor(0)
          }, 8000)
          return
        }
        let urim =
          `${HOST}/_getplay?aid=${that.id}&playindex=${ma[0]}&epindex=${ma[1]}&r=` +
          rand
        let cookiestr = cookieToStr(cookie)
        console.log('地址是', urim)
        console.log('cookie值是，', cookiestr)
        suagent(urim, {
          setMap: {
            referer: refuri,
            // cookie: '__cfduid=dc277b0ef26e42211a696923c79f1a62d1614644427; fa_c=1; Hm_lvt_7fdef555dc32f7d31fadd14999021b7b=1614559656,1614644427,1614694322,1614694470; fa_t=1614694539324; t1='+Date.now()+'; k1=248882400; k2=51805307540059; t2='+(Date.now() + 7100)+'; Hm_lpvt_7fdef555dc32f7d31fadd14999021b7b=1614694726'
            // cookie: 'fa_c=1; fa_t='+(Date.now() - 178665 + parseInt(Math.random() * 2000))+'; t1='+Date.now()+'; t2='+(Date.now() + 7100)+';'
            cookie: cookiestr,
          },
        })
          .then((res) => {
            let { text } = res
            // console.log('-------------res-----------------')
            if (text == 'err:timeout') {
              // let tempCookieArr = res.headers['set-cookie'].map(it => it.split(';')[0].split('='))
              /* tempCookieArr.forEach(it => {
							tempCookieMap[it[0]] = it[1]
						}) */
              let tempCookieMap = getHeaderCookie(
                res.headers['set-cookie'],
                true
              )
              setTimeout(() => {
                intor(
                  idx + 1,
                  getTempCookie({
                    ...cookie,
                    ...getCurrentUrlCookie(refuri),
                    ...tempCookieMap,
                    k2: getk2(tempCookieMap.t1),
                  })
                )
              }, 500)
              return
            }
            that.lastRealCookie = cookie
            // console.log(res.headers)
            // console.log(res.statusCode)
            let jsonData = JSON.parse(text)
            console.log('aagfuns获取到结果值了啊', text)
            let videourl = decodeURIComponent(jsonData.vurl)
            // 这个地址可能会返回跟之前不一样的格式，所以非常烦啊

            // if (shtype == jsonData.playid)
            resolve(videourl)
          })
          .catch((err) => {
            console.log('err', '怎么又报错了')
            setTimeout(() => {
              intor(
                idx + 1,
                getTempCookie({
                  ...cookie,
                  ...getCurrentUrlCookie(refuri),
                })
              )
            }, 500)
          })
      })(0)
    })
  }
}

// 获取当前页面的cookie，因为他cookie是必须的
// https://www.agefans.net/play/20160098?playid=3_7
function getCurrentUrlCookie(uri) {
  let cookie = {}
  function __setCookie(key, val) {
    cookie[key] = val
  }

  function __age_cb_getplay_url(uriml) {
    const _url = uriml
    const _rand = Math.random()
    var _getplay_url =
      _url.replace(
        /.*\/play\/(\d+?)\?playid=(\d+)_(\d+).*/,
        '/_getplay?aid=$1&playindex=$2&epindex=$3'
      ) +
      '&r=' +
      _rand
    var re_resl = _getplay_url.match(/[&?]+epindex=(\d+)/)
    const hf_epi = '' + FEI2(re_resl[1])
    const t_epindex_ = 'epindex='
    _getplay_url = _getplay_url.replace(
      t_epindex_ + re_resl[1],
      t_epindex_ + hf_epi
    )
    return _getplay_url
  }

  function FEI2(in_epi) {
    //
    var hf_epi = Number(in_epi)
    const time_curr = new Date().getTime()

    var fa_t = Number(undefined)
    if (!fa_t) {
      fa_t = time_curr
    }

    var fa_c = Number(undefined)
    if (!fa_c) {
      fa_c = 0
    }

    //
    if (time_curr - fa_t > 6000) {
      fa_t = 0
      fa_c = 0
    }

    //
    fa_c += 1
    fa_t = time_curr

    //
    if (fa_c > 10) {
      fa_t = 0
      fa_c = 0
      //
      if (hf_epi > 1) {
        hf_epi = time_curr % hf_epi
        if (!hf_epi) {
          hf_epi = 1
        }
      }
    }

    //
    __setCookie('fa_t', fa_t, 1)
    __setCookie('fa_c', fa_c, 1)

    //
    return hf_epi
  }
  __age_cb_getplay_url(uri)
  return cookie
}

module.exports = Download
