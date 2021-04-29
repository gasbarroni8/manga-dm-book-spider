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
  forEach$list,
  execParams,
  getIdByLastItem,
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

class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id)
    this.showType = showType
    this.setMgData = setMgData
    this.getMgData = getMgData
    this.deleteMgData = deleteMgData
    this.getMgOutput = getMgOutput
    this.getListUrl = HOST + '/manhua/' + this.id + '/'
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
  }

  // 解析列表并返回
  execList(text) {
    const that = this
    const $ = cheerio.load(text)

    const name = escapeSpecChart($('.book-title').find('h1 span').text())
    const list = []
    const $as = $('#comic-chapter-blocks ul li')
    const map = {}

    for (let i = 0, len = $as.length; i < len; i++) {
      const $item = $as.eq(i).find('a')
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
        url: getIdByLastItem($item.attr('href')).replace('.html', ''),
        title,
        showTitle,
        // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
      })
    }

    const obj = {
      id: that.id,
      name,
      unclearTotal: true,
      list,
    }

    return obj
  }
  getMaxPageCount({ url }, pageIndex) {
    return this.getPicList(url).then((picList) => {
      this.list[pageIndex].picList = picList
      return picList.length
    })
  }

  getPicList(urlAsId) {
    const urlpath = this.getListUrl + urlAsId + '.html'
    return getPicHost().then((picHost) => {
      // console.log(picHost, urlpath)
      return suagent(urlpath, {
        setMap: {
          Referer: this.getListUrl,
        },
      }).then(({ text }) => {
        let picList = execPicList(text, picHost)
        // console.log(res)
        return picList
      })
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
        saveFile(encodeURI(picList[mgIndex - 1]), dirpath, mgIndex, 'jpg', HOST)
          .then((res) => {
            that.errorCount = 0
            console.log('图片保存成功！')
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            resolve({ code: 'ok' })
          })
          .catch((err) => {
            that.errorCount++
            console.log('保存图片失败')
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
}

function getPicHost() {
  return suagent(HOST + '/js/config.js').then(({ text }) => {
    // console.log(text)
    var toastr = {
      options: {},
    }
    eval(text)
    return SinConf.resHost[0].domain[0]
  })
}

function execPicList(text, picHost) {
  const $ = cheerio.load(text)

  var tempPicList, imgPath
  forEach$list($('script'), ($item) => {
    let html = $item.html()
    console.log('ff')
    if (html.indexOf('chapterImages') != -1) {
      console.log('find it')
      eval(html)
      tempPicList = chapterImages
      imgPath = chapterPath
        .split('/')
        .filter((it) => !!it)
        .join('/')
      return false
    }
  })

  return tempPicList.map((it) => addHttp(it, picHost + '/' + imgPath + '/'))
}

module.exports = Download
