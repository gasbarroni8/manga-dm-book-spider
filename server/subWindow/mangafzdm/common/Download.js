/*
 * @author: neos55555
 */
// const path = require('path')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {
  saveFile,
  setRandTimeout,
  selfmkdir,
  escapeSpecChart,
  suagent,
  trans,
  execFnloop,
  execParams,
  getRand,
} = require('../../../lib')
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  showType,
} = require('./function.js')
const { HOST } = require('./comData')

const picUrlList = []
picUrlList[1] = 'http://p1.manhuapan.com'
picUrlList[2] = 'https://p5.manhuapan.com'
picUrlList[3] = 'http://p17.manhuapan.com'
picUrlList[4] = 'http://www-mipengine-org.mipcdn.com/i/p3.manhuapan.com'
picUrlList[5] = 'http://p6.manhuapan.com'

class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id)
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.getListUrl = HOST + '/' + this.id + '/'
    this.picUrlHost =
      picUrlList[parseInt(getRand(0, picUrlList.length * 10) / 10)]
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
  }

  // 解析列表并返回
  execList(text) {
    const that = this

    const $ = cheerio.load(text)
    const name = escapeSpecChart($('#content').find('img').eq(0).attr('alt'))
    const list = []
    const $as = $('#content li')
    const map = {}

    for (let i = $as.length; i--; ) {
      const $item = $as.eq(i).find('a')
      let title = escapeSpecChart($item.text().replace(/\s|(（.+）)/gi, ''))
      if (map[title] !== undefined) {
        map[title]++
        title += map[title]
      } else {
        map[title] = 0
      }
      list.push({
        url: $item.attr('href').replace(/\//gi, ''),
        title,
        isUnknowPageTotal: true, // 这里是用来告诉后台，当前页面的总数是不确定的
        // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
      })
    }

    const obj = {
      id: that.id,
      name,
      unclearTotal: true, // 这里是用来告诉页面，不可使用总数的
      list,
    }

    return obj
  }
  getMaxPageCount({ url }) {
    return this.getParams(url).then((res) => {
      return res.bdSize
    })
  }

  getParams(urlAsId, mgIndex = 0) {
    console.log(urlAsId, mgIndex)
    const prevUrl = `${HOST}/${this.id}/`
    var atr = mgIndex ? `index_${mgIndex}.html` : ''
    let url = `${prevUrl}${encodeURI(urlAsId)}/${atr}`

    const that = this
    that.pageUrl = url

    return suagent(url, {
      setMap: {
        Referer: prevUrl,
      },
    }).then(({ text }) => {
      const params = getExecPrams(text, that.picUrlHost)
      return params
    })
  }
  // 因为无法得知总数，所以提供专门函数用于处理
  // 每次都只下载这一章节的
  downloadForUnknow(pageIndex) {
    // 这里的maxPageCount就是下载量，
    // const { url, title, maxPageCount = 0 } = this.list[pageIndex]
    const { url, title } = this.list[pageIndex]
    const dirpath = this.dirpath + '/' + title
    return new Promise((resolve, reject) => {
      let maxStoreCount = 0
      let maxBzSize = null
      // 如果之前下载 完了，那说个几把呢
      this.getChapterFilesArr(pageIndex).then((fileNameArr) => {
        let maxPageCount = (fileNameArr[fileNameArr.length - 1] || 0) - 1
        maxPageCount = maxPageCount < 0 ? 0 : maxPageCount

        execFnloop((next, mgIndex, execCurrent) => {
          if (this.isStop()) {
            return reject('stop')
          }
          if (maxBzSize != null && mgIndex > maxBzSize) {
            // 结束
            console.log(this.showType, '走完了')
            resolve({
              code: 'ok',
              info: '当前页面编列完毕',
            })
          } else {
            this.getParams(url, mgIndex - 1)
              .then(({ bdSize, mhpicurl }) => {
                console.log(
                  '没有总数？？？',
                  mhpicurl,
                  ',bdSize:',
                  bdSize,
                  ',mgIndex:',
                  mgIndex,
                  ',maxBzSize:',
                  maxBzSize
                )
                // if (bdSize == null || mgIndex <= maxBzSize || maxBzSize == null) {
                if (bdSize != null && maxBzSize == null) {
                  maxBzSize = bdSize
                  // 设置总数
                  this.setConfigListItem(pageIndex, 'maxPageCount', maxBzSize)
                  this.delConfigListItem(pageIndex, 'isUnknowPageTotal')
                  console.log('下载完结，设置总数')
                  // this.delConfigListItem(pageIndex, 'prevDownload')
                }
                // 如果多个漫画下载的话，会造成文件大量读取，而报错
                this.saveMgPic(mhpicurl, dirpath, mgIndex).then((res) => {
                  if (++maxStoreCount >= 2 && maxBzSize == null) {
                    // 用这个来缓冲，如果总数已经出来，那么就说明上面已经设置过了
                    maxStoreCount = 0
                    this.setConfigListItem(pageIndex, 'maxPageCount', mgIndex)
                  }
                  next()
                })
                // }
              })
              .catch((err) => {
                if (err.is404) {
                  console.log(err)
                  // console.log(err.status)
                  if (err.is404) {
                    // 没有这一页，所以改成成功
                    this.addCount404(pageIndex, mgIndex)
                  }
                  console.log(
                    '获取第' + pageIndex + '话' + mgIndex + '图参数失败'
                  )
                  next()
                } else {
                  // 只要不是404就可以再来一次当前这个函数
                  // 但是也不能在这一个上面死耗啊，只要不是404就可以一直在这里
                  // 但是如果刚好这一个是最后一页呢？找不到max就会一直往后面走了
                  execCurrent()
                }
              })
          }
        }, maxPageCount)
      })
    })
  }
  saveMgPic(mhpicurl, dirpath, mgIndex) {
    const that = this
    selfmkdir(dirpath)
    return new Promise((resolve) => {
      setRandTimeout(() => {
        saveFile(mhpicurl, dirpath, mgIndex, 'jpg', that.pageUrl)
          .then((res) => {
            console.log('图片保存成功！')
            that.errorCount = 0
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            resolve({ code: 'ok' })
          })
          .catch((err) => {
            console.log('保存图片失败')
            that.errorCount++
            console.log(err)
            if (err.is404) {
              // 没有这一页，所以改成成功
              that.addCount404(pageIndex, mgIndex)
            }
            resolve({ code: 'err' })
          })
      })
    })
  }

  // 获取第几话中，第几页的漫画
  getImgByMgIndex(pageIndex, mgIndex) {
    const that = this
    const { url, maxPageCount, title } = this.list[pageIndex]

    console.log(`开始下载第${pageIndex}话，第${mgIndex}页漫画`)

    return new Promise((resolve, reject) => {
      // return;
      if (mgIndex > maxPageCount) {
        resolve({ code: 'ok' })
        return
      }
      if (that.isStop()) {
        return reject('stop')
      }

      that
        .getParams(url, mgIndex - 1)
        .then((params) => {
          const { mhpicurl } = params
          // that.maxMg = that.maxMg || params.MANGABZ_IMAGE_COUNT
          // that.endMg = params.MANGABZ_CURL_END;
          // let maxMg = maxPageCount;
          // params = {...params, MANGABZ_PAGE: mgIndex}
          if (that.isStop()) {
            return reject('stop')
          }
          const dirpath = that.dirpath + '/' + title
          selfmkdir(dirpath)
          //
          setRandTimeout(() => {
            saveFile(mhpicurl, dirpath, mgIndex, 'jpg', that.pageUrl)
              .then((res) => {
                console.log('图片保存成功！')
                that.errorCount = 0
                that.onSaveSuccess &&
                  that.onSaveSuccess.call(that, ++that.downloaded)
                resolve({ code: 'ok' })
              })
              .catch((err) => {
                console.log('保存图片失败')
                that.errorCount++
                console.log(err)
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
          console.log(err)
          // console.log(err.status)
          if (err.is404) {
            // 没有这一页，所以改成成功
            that.addCount404(pageIndex, mgIndex)
          }
          console.log('获取第' + pageIndex + '话' + mgIndex + '图参数失败')
          // console.log('如果看到一大堆失败，不要慌，网站抽了，让程序慢慢跑吧！')

          resolve({ code: 'err' })
        })
    })
  }
}

// index_17.html
function getPageNum(str) {
  return parseInt(str.split('_')[1])
}
function getExecPrams(text, picUrlHost) {
  const $ = cheerio.load(text)
  var $ss = $('script')
  var params = {},
    _bd_share_config = {
      common: {},
    }
  for (var i = 0, len = $ss.length; i < len; i++) {
    let html = $ss.eq(i).html()
    if (html.indexOf('getCookie("picHost")') != -1) {
      params = execParams(html)
    } /*  else if (html.indexOf('window._bd_share_config') != -1) {
      eval(html.replace(/(with.+)/gi, '').replace(/window./gi, 'var '))
    } */
  }
  // console.log(params)
  const { mhurl } = params
  let mhss = picUrlHost
  if (
    mhurl.indexOf('2016') == -1 &&
    mhurl.indexOf('2017') == -1 &&
    mhurl.indexOf('2018') == -1 &&
    mhurl.indexOf('2019') == -1 &&
    mhurl.indexOf('2020') == -1 &&
    mhurl.indexOf('2021') == -1
  ) {
    mhss = 'https://p5.manhuapan.com'
  }
  // console.log(_bd_share_config)
  const $lis = $('.navigation').find('a:not(.pure-button-primary)')
  let bdSize = undefined
  const prevNum = getPageNum($lis.eq($lis.length - 2).attr('href')) + 1
  const lastNum = getPageNum($lis.eq($lis.length - 1).attr('href')) + 1
  if (prevNum == lastNum) {
    bdSize = lastNum
  } else if ($('.navigation').text().indexOf('最后') != -1) {
    bdSize = lastNum
  }
  console.log('size', prevNum, lastNum)
  /* const islast =
      $lis.eq($lis.length - 2).attr('href') ===
        $lis.eq($lis.length - 1).attr('href') ||
      $('.navigation').text().indexOf('最后') != -1

  const bdSize = islast ? parseInt($lis.eq($lis.length - 2).text()) : undefined */
  const pms = {
    mhpicurl: mhss + '/' + mhurl,

    bdSize,
    // bdSize: parseInt(_bd_share_config.common.bdSize) || 0,
  }
  // params.bdSize =

  return pms
}

module.exports = Download
