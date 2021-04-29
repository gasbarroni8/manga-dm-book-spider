// const fs = require('fs')
const cheerio = require('cheerio')
const {
  suagent,
  setRandTimeout,
  selfmkdir,
  escapeSpecChart,
  saveTxt,
} = require('../../../lib')
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  showType,
} = require('./function.js')
const { HOST } = require('./comData')
const AllDownload = require('../../../lib/AllDownload')

class Download extends AllDownload {
  constructor(id) {
    super(id)
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.getListUrl = `${HOST}/read/${this.id}/`
    // selfmkdir(this.dirpath)
  }

  // 递归查询该漫画的所有文件夹是否下载完成，已完成就会关闭

  execList(text) {
    const that = this
    const $ = cheerio.load(text)
    const $lis = $('#list').find('dd')
    const list = []
    const name = escapeSpecChart($('#info').find('h1').eq(0).text())
    const map = {}
    const urlMap = {}
    for (let i = 0, len = $lis.length; i < len; i++) {
      const $item = $lis.eq(i).find('a')
      let url = $item.attr('href').split('/')
      url = url[url.length - 1].replace('.html', '')

      if (urlMap[url]) {
        list.splice(
          list.findIndex((it) => it.url === url),
          1
        )
        // break;
      }
      urlMap[url] = true

      let title = escapeSpecChart($item.text())
      if (map[title] !== undefined) {
        map[title]++
        title += map[title]
      } else {
        map[title] = 0
      }

      list.push({
        url,
        title,
      })
    }

    const obj = {
      id: that.id,
      name,
      list,
    }

    return obj
  }

  // 得到书籍的1章节 -- 再5x里是5000字
  saveBookChapter(urlAsId, title, pageIndex) {
    const that = this
    const url = `${HOST}/read/${this.id}/${urlAsId}.html`

    return new Promise((resolve, reject) => {
      if (this.isStop()) {
        return reject('stop', '只是暂停')
      }
      suagent(url, {
        set: {
          Referer: `${HOST}/read/${this.id}`,
        },
      })
        .then(({ text }) => {
          const $ = cheerio.load(text)
          const $content = $('#content')
          // $content.find('.view_page').remove()
          let ctnText = $content.text()
          ctnText = ctnText.replace(
            /因某些原因，今天突然出现大量用户无法打开网页访问本站，请各位书友牢记本站域名(.+)找到回家的路！/gi,
            ''
          )

          // 一页一页更新
          // path.resolve(__dirname, '..'+fileUrl))
          const filepath = `${this.dirpath}/${title}`
          selfmkdir(filepath)

          that.errorCount = 0
          saveTxt(filepath + '/1.txt', ctnText).then(() => {
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            // that.setPageOver(pageIndex, true)
            setRandTimeout(function () {
              resolve({ code: 'ok' })
            })
          })
        })
        .catch((err) => {
          that.errorCount++
          if (err.is404) {
            // 没有这一页，所以改成成功
            that.addCount404(pageIndex, 1)
            // that.onSaveSuccess && that.onSaveSuccess.call(that, ++that.downloaded)
            // that.setPageOver(pageIndex, true)
          }
          resolve({ code: 'err' })
        })
    })
  }
  // 下载缺页
  downLackByListCb(pageIndex) {
    const item = this.list[pageIndex]
    return this.saveBookChapter(item.url, item.title, pageIndex)
  }
}

module.exports = Download
