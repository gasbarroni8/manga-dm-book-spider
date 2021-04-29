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

class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id) // 这个是漫画目录
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.extend1 = getMgData([this.id, 'extend1']) // 这个是漫画id
    // this.folderName = getMgData([this.id, 'extend1'])
    this.getListUrl = HOST + '/b/' + this.id + '/'
    this.isApp = true
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
  }

  // 解析列表并返回
  execList(text) {
    const that = this

    const $ = cheerio.load(text)

    // 这块需要重新获取id
    const $scripts = $('script')
    for (let i = 0, len = $scripts.length; i < len; i++) {
      let html = $scripts.eq(i).html()
      if (html.indexOf('comicFolder') != -1) {
        that.extend1 = execParams(html).comicId
        break
      }
    }

    const name = escapeSpecChart($('.book_newtitle').text())
    const list = []
    const $as = $('.comic_main_list a')
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
        showTitle,
        url: $item.attr('href'),
        title,
        // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
      })
    }

    const obj = {
      id: that.id,
      name,
      extend1: that.extend1,
      unclearTotal: true,
      list,
    }

    return obj
  }
  // list中某一个
  getMaxPageCount({ url }, pageIndex) {
    return this.getPicList(url).then((picList) => {
      this.list[pageIndex].picList = picList
      return picList.length
    })
  }
  getPicList(urlAsId) {
    var urlArr = urlAsId.split('/').filter((it) => it)

    const urlpath =
      HOST +
      `/ajax/Common.ashx?op=getPics&cid=${this.extend1}&serial=&path=${
        urlArr[urlArr.length - 1]
      }&_=${Date.now()}`
    console.log(urlpath)

    return suagent(urlpath, {
      setMap: {
        Referer: HOST,
      },
    }).then(({ text }) => {
      const res = JSON.parse(text)
      // console.log(res)
      return res.data || []
    })
  }

  // 获取第几话中，第几页的漫画
  async getImgByMgIndex(pageIndex, mgIndex) {
    let { url, maxPageCount, title, picList } = this.list[pageIndex]
    if (!picList) {
      try {
        picList = await this.getPicList(url)
        this.list[pageIndex].picList = picList
      } catch (err) {
        picList = []
      }
    }

    const that = this
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

      const dirpath = that.dirpath + '/' + title
      selfmkdir(dirpath)
      //
      setRandTimeout(() => {
        saveFile(
          picList[mgIndex - 1],
          dirpath,
          mgIndex,
          'jpg',
          picList[mgIndex - 1]
        )
          .then((res) => {
            console.log('图片保存成功！')
            that.errorCount = 0
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            resolve({ code: 'ok' })
          })
          .catch((err) => {
            that.errorCount++
            console.log('保存图片失败')
            console.log(err)
            if (err.is404) {
              that.addCount404(pageIndex, mgIndex)
              // that.onSaveSuccess && that.onSaveSuccess.call(that, ++that.downloaded)
              // that.setPageOver(pageIndex, true)
            }
            resolve({ code: 'err' })
          })
      })
    })
  }
}

module.exports = Download
