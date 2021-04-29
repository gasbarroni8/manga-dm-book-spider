/*
 * @author: neos55555
 */
// const path = require('path')
// const superagent = require('superagent')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {
  getDomainIp,
  saveFile,
  setRandTimeout,
  suagent,
  selfmkdir,
  escapeSpecChart,
  trans,
  execParams,
} = require('../../../lib')
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  userAgent,
  showType,
} = require('./function.js')
// const { MANGABZ } = require(path.resolve(process.env.MAIN_DIR,'./constant'))
// const fs = require('fs');

const timeout = 25000 // 响应超时的时间
const HOST = 'http://www.mangabz.com'

var d

// url.replace(/((http|https):\/\/)|(www.mangabz.com)|(\/)/ig, '')
class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id)
    this.showType = showType
    this.domain = 'mangabz.com'
    // this.ip = ip
    // this.url = HOST + '/'+id+'/';
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.getListUrl = HOST + '/' + this.id + '/'
    // this.id = id
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
  }

  execList(text) {
    const that = this

    const $ = cheerio.load(text)
    const name = escapeSpecChart($('.detail-info-title').text())
    const list = []
    const $as = $('#chapterlistload').find('a')
    const map = {}

    for (let i = $as.length; i--; ) {
      const $item = $as.eq(i)
      let showTitle = $item.text().replace(/\s|(（.+）)/gi, '')
      let title = escapeSpecChart(showTitle)
      if (map[title] !== undefined) {
        map[title]++
        title += map[title]
      } else {
        map[title] = 0
      }
      showTitle = showTitle === title ? undefined : showTitle
      list.push({
        url: $item.attr('href'),
        title,
        showTitle,
        maxPageCount: parseInt(
          $item.find('span').text().replace(/（|）/gi, '')
        ),
      })
    }

    const obj = {
      id: that.id,
      name,
      list,
    }
    return obj
  }

  // 获取第几话中，第几页的漫画
  getImgByMgIndex(pageIndex, mgIndex) {
    const that = this
    const { url, maxPageCount, title } = this.list[pageIndex]

    console.log(`开始下载第${pageIndex}话，第${mgIndex}页漫画`)

    return new Promise((resolve, reject) => {
      var murl = that.getShowUrl(mgIndex, url, maxPageCount)
      if (mgIndex > maxPageCount) {
        resolve({ code: 'ok' })
        return
      }
      if (that.isStop()) {
        return reject('stop')
      }

      that
        .getParams(murl)
        .then((params) => {
          // that.maxMg = that.maxMg || params.MANGABZ_IMAGE_COUNT
          that.endMg = params.MANGABZ_CURL_END
          // let maxMg = maxPageCount;
          // params = {...params, MANGABZ_PAGE: mgIndex}
          if (that.isStop()) {
            return reject('stop')
          }
          setRandTimeout(() => {
            saveImg(murl, params, {
              dirpath: this.dirpath + '/' + title,
              ip: this.ip,
              domain: this.domain,
            })
              .then((res) => {
                console.log('continue，继续下一次获取图片')
                that.errorCount = 0
                // console.log('continue，继续下一次获取图片');
                that.downloaded++
                // console.log('-------------------');
                // console.log(that.onSaveSuccess)
                // console.log('-------------------');
                // setMgData([that.id, 'list', pageIndex, 'isOver'], true)
                that.onSaveSuccess &&
                  that.onSaveSuccess.call(that, that.downloaded)
                // that.setPageOver(pageIndex, true)
                resolve({ code: 'ok' })
              })
              .catch((err) => {
                that.errorCount++
                if (err.is404) {
                  // 没有这一页，所以改成成功
                  that.addCount404(pageIndex, mgIndex)
                }
                resolve({ code: 'err' })
              })
          })
        })
        .catch((err) => {
          // ETIMEDOUT
          console.log(err.code)
          // console.log(err.status)
          if (err.is404) {
            // 没有这一页，所以改成成功
            that.addCount404(pageIndex, mgIndex)
            // that.setPageOver(pageIndex, true)
            // setMgData([that.id, 'list', pageIndex, 'isOver'], true)
          }
          console.log('获取第' + pageIndex + '话' + mgIndex + '图参数失败')
          // console.log('如果看到一大堆失败，不要慌，网站抽了，让程序慢慢跑吧！')

          resolve({ code: 'err' })
        })
    })
  }

  getShowUrl(cpg, defaultCurl, maxPageCount) {
    var _url
    if (cpg == 1) {
      _url = defaultCurl
    } /* else if (cpg == maxPageCount) {
	    	_url = this.endMg
	    }*/ else {
      var croot = defaultCurl.substring(0, defaultCurl.length - 1) + '-p'
      _url = croot + cpg + '/'
    }
    return HOST + _url
  }

  getParams(url) {
    return new Promise((resolve, reject) => {
      var mm = url.split('?')[0]
      var re = /m\d+-p(\d+)\/?/
      var mat = mm.match(re) || [0, 1]
      // console.log('开始获取图片所需要的参数')
      // console.log(url)

      suagent(url)
        .then(({ text }) => {
          // console.log('图片所需要的参数获取成功')
          const $ = cheerio.load(text)
          const $ss = $('head').find('script')
          let html = $ss
            .eq(3)
            .html()
            .replace(
              'reseturl(window.location.href, MANGABZ_CURL.substring(0, MANGABZ_CURL.length - 1));',
              ''
            )
          const params = execParams(html)
          params.MANGABZ_PAGE = parseInt(mat[1])
          resolve(params)
        })
        .catch(reject)
    })
  }
}

function saveImg(url, params, { dirpath, domain, ip }) {
  return new Promise((resolve, reject) => {
    // var url =
    const prs = {
      cid: params.MANGABZ_CID,
      page: params.MANGABZ_PAGE,
      key: '',
      _cid: params.MANGABZ_CID,
      _mid: params.MANGABZ_MID,
      _dt: params.MANGABZ_VIEWSIGN_DT.split(' ').join('+'),
      _sign: params.MANGABZ_VIEWSIGN,
    }

    // selfmkdir(`${dirpath}/${params.MANGABZ_CURL.replace(/\//ig, '')}`)
    console.log('开始获取图片地址')

    suagent(url + 'chapterimage.ashx?' + trans(prs), {
      setMap: {
        Referer: url,
        'User-Agent': userAgent,
      },
    })
      .then(function ({ text }) {
        eval(text)
        if (!text) {
          reject('error')
          console.log('获取图片地址失败！')
          return
        }
        console.log('图片地址如下：')
        console.log(d[0])
        // console.log(d)
        // return;
        saveFile(
          encodeURI(d[0]),
          dirpath,
          // `manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`,
          params.MANGABZ_PAGE,
          'jpg',
          url
        )
          .then((res) => {
            console.log('图片保存成功！')
            resolve()
          })
          .catch((err) => {
            console.log('保存图片失败')
            console.log(err)
            reject(err)
          })
      })
      .catch((err) => {
        console.log('获取图片地址失败！')
        reject(err)
      })
    // .query(prs)
    // .set('Cookie', cookie)
    // .set('User-Agent', ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36 Aoyou/UWw7YQlYOVZ9M3haXXN2OLgCJxZ_UrUY8V3G22OqBgD13uvfV4p6DDBNbA==')
  })
}

module.exports = Download
