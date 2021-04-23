// const fs = require('fs')
// const path = require('path')
const cheerio = require('cheerio')
const {
  suagent,
  setRandTimeout,
  selfmkdir,
  saveTxt,
  escapeSpecChart,
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
// const { MAX_DOWNLOAD_ERROR_COUNT } = require('../../../constant')

class Download extends AllDownload {
  constructor(id) {
    super(id)
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.getListUrl = `${HOST}/read/${this.id}.html`
  }

  execList(text) {
    const that = this

    const $ = cheerio.load(text)
    const $lis = $('.view_content .read_list').find('a')
    const name = escapeSpecChart($('.view_t').text().replace('_分节阅读', ''))
    const list = []

    for (let i = 0, len = $lis.length; i < len; i++) {
      list.push({
        title: i + 1,
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
  saveBookChapter(title, pageIndex) {
    const that = this
    const url = `${HOST}/read/${this.id}_${title}.html`

    return new Promise((resolve, reject) => {
      if (this.isStop()) {
        return reject('stop', '只是暂停')
      }
      suagent(url)
        .then(({ text }) => {
          const $ = cheerio.load(text)
          const $content = $('#view_content_txt')
          $content.find('.view_page').remove()
          let ctnText = $content.text()
          if (text.indexOf('D-') == 3) {
            ctnText = ctnText.slice(0, 3) + ctnText.slice(5)
          }
          // return;
          //
          // 一页一页更新
          // path.resolve(__dirname, '..'+fileUrl))
          const filepath = `${this.dirpath}/${title}`
          selfmkdir(filepath)
          // return;
          // const txtUrl = `../static/txt2/${id}/${id+'_'+pageIndex}.txt`
          that.errorCount = 0
          saveTxt(filepath + `/1.txt`, ctnText).then(() => {
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            // that.setPageOver(pageIndex, true)
            setRandTimeout(function () {
              resolve({
                code: 'ok',
              })
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
          resolve({
            code: 'err',
          })
        })
    })
  }

  // 下载缺页
  downLackByListCb(pageIndex) {
    const item = this.list[pageIndex]
    return this.saveBookChapter(item.title, pageIndex)
  }
}

module.exports = Download
