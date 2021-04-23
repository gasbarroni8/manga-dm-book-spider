const { getData, setData } = require('./store')
const {
  OUTPUT,
  userAgentArr,
  appUserAgentArr,
  mergeTsName,
} = require('../constant')
const superagent = require('superagent')
var charset = require('superagent-charset')
const sendRequest = require('./send')
charset(superagent) //设置字符

const fs = require('fs')
const path = require('path')
const timeout = 30000
const comFunction = require('../com-function')
// 导出公共函数
Object.keys(comFunction).forEach((key) => {
  exports[key] = comFunction[key]
})

const fsFunction = require('./fslib')

Object.keys(fsFunction).forEach((key) => {
  exports[key] = fsFunction[key]
})

const userAgent =
  userAgentArr[parseInt(getRand(0, userAgentArr.length * 10) / 10)]
exports.userAgent = userAgent

const appUserAgent =
  appUserAgentArr[parseInt(getRand(0, appUserAgentArr.length * 10) / 10)]
exports.appUserAgent = appUserAgent

exports.cookieToStr = (cookie = {}) =>
  Object.keys(cookie)
    .reduce((total, pr) => total + pr + '=' + cookie[pr] + '; ', '')
    .trim()

exports.execUrlParams = (url) => {
  let temp = url.split('?')
  temp = temp[temp.length - 1]
  let obj = {}
  temp.split('&').forEach((it) => {
    let a = it.split('=')
    obj[a[0]] = a[1]
  })
  return obj
}
exports.escapeSpecChart = (s = '') => {
  // 去掉转义字符
  s = s.replace(/[\'\"\\\/\b\f\n\r\t]/g, '')
  // 去掉特殊字符
  s = s.replace(/[\s\@\#\$\%\^\&\*\{\}\:\.\"\'\<\>\?\|\-\=\+\?]/gi, '')
  return s
}

exports.saveFile = function (url, dirUrl, fileName, type, refurl, setMap) {
  console.log('saveFile 地址是，', url)
  return new Promise((resolve, reject) => {
    let temp = superagent.get(url)
    if (refurl) {
      temp = temp.set('Referer', refurl)
    }

    Object.keys(setMap || {}).forEach((key) => {
      // console.log(key)
      temp = temp.set(key, setMap[key])
    })
    // console.log('imgurl---', url)
    temp
      .timeout(timeout)
      .then((res) => {
        const fileUrl = `${dirUrl}/${fileName}.${type}`
        // console.log(fileUrl)
        fs.writeFile(
          path.resolve(__dirname, fileUrl),
          res.body,
          'binary',
          function (err) {
            if (err) {
              return reject(err)
            }
            resolve('ok')
          }
        )
      })
      .catch((err) => {
        reject({
          isTimeout: err.code == 'ETIMEDOUT' || err.code == 'ECONNABORTED',
          is404: err.status == 404,
          err: err,
        })
      })
  })
}

// 链接资源是否可用
function linkResourceisOk(linkuri, setMap) {
  console.log('进入资源检测阶段', linkuri)
  if (!linkuri) {
    console.log('暂无资源链接')
    return Promise.reject()
  }
  let usagent = setSuperagent('get', superagent['head'](linkuri), { setMap })
  // let ua = isApp ? appUserAgent : userAgent
  return new Promise((resolve, reject) => {
    usagent
      .set('User-Agent', userAgent)
      .timeout(timeout)
      .end(function (err, res) {
        if (err) {
          // console.log(url)
          const obj = {
            isTimeout: err.code == 'ETIMEDOUT' || err.code == 'ECONNABORTED',
            is404: err.status == 404 || err.code == 'ENOTFOUND',
            is403: err.status == 403,
            err: err,
          }
          console.log('资源有点问题', obj)
          reject(obj)
          return
        }
        console.log('资源可用，能下载')
        resolve(res)
        // setData(['book', 'book5x', id, 'list'], list)
      })
  })
}
exports.linkResourceisOk = linkResourceisOk

// 文件下载,王
exports.downloadFile = function downloadFile(
  videourl,
  videopath,
  TIMEOUT = timeout,
  setMap
) {
  // 这里直接下载是因为前面已经做过检测了
  return new Promise((resolve, reject) => {
    superagent
      .get(videourl)
      .on('end', () => {
        resolve()
      })
      .on('error', (err) => {
        reject(err)
      })
      .pipe(fs.createWriteStream(videopath))
  })
}

const getCoverOutput = () => {
  const output = getData([OUTPUT])
  if (output) {
    return output + '/cover'
  }
  return false
}

exports.getOutput = () => getData([OUTPUT])
exports.setOutput = (path) => setData([OUTPUT], path)
exports.getCoverOutput = getCoverOutput
exports.getCoverDirpath = (showType, id) =>
  getCoverOutput() + '/' + showType + '-' + id + '.jpg'

function getRand(a, b) {
  return Math.floor(Math.random() * (b - a) + a)
}

exports.setRandTimeout = (fn, minSec = 4000, maxSec = 6000) => {
  return setTimeout(fn, getRand(minSec, maxSec))
}
exports.addHttp = (url, ref = 'http:') => {
  if (!url) {
    return ''
  }
  if (url.indexOf('http') == -1) {
    return ref + url
  }
  return url
}
function execFnloop(fn, count = 0) {
  ;(function intor(icount) {
    fn &&
      fn(
        () => intor(icount + 1),
        icount + 1,
        () => intor(icount)
      )
  })(count)
}
exports.execFnloop = execFnloop

function execByList(lackArr, callback, maxsize = 10) {
  const max = maxsize
  const length = lackArr.length

  let count = Math.ceil(length / max)
  if (length == 0) {
    return Promise.resolve({
      code: 'ok',
      info: '当前列表为空',
    })
  }

  return new Promise((resolve, reject) => {
    execFnloop((next, icount) => {
      icount = icount - 1
      if (icount >= count) {
        console.log('所有都执行完了')
        resolve({
          code: 'ok',
          info: '当前列表执行完了',
        })
        return
      }
      let arr = []
      let len = (icount + 1) * max
      len = length < len ? length : len
      for (let i = icount * max; i < len; i++) {
        arr.push(callback(lackArr[i], i))
      }
      Promise.all(arr)
        .then((res) => {
          console.log(res)
          setTimeout(() => {
            next()
          }, 1999)
        })
        .catch((err) => {
          reject({
            code: 'err',
            err,
          })
          console.log(err, '报啥错了?')
        })
    })
  })
}
exports.execByList = execByList

function getResourceType(uri = '') {
  return new Promise((resolve, reject) => {
    superagent
      .head(uri)
      .timeout(55000)
      .then((res) => {
        const type = res.type.toLowerCase()
        console.log('文件类型是', type)
        resolve(type)
      })
      .catch((err) => {
        console.log('获取资源类型错误，该链接报错')
        reject('')
      })
  })
}
exports.getResourceType = getResourceType

exports.getRand = getRand

function setSuperagent(method, suagent, map = {}) {
  let temp = suagent
  const { setMap = {}, data = {}, charset = 'utf8', disableTLSCerts } = map
  if (Object.keys(data).length > 0) {
    temp = temp[method == 'get' ? 'query' : 'send'](data)
  }

  Object.keys(setMap).forEach((key) => {
    // console.log(key)
    temp = temp.set(key, setMap[key])
  })
  if (disableTLSCerts) {
    temp = temp.disableTLSCerts()
  }
  return temp.charset(charset).buffer(true)
}
function suagentUtf(method, url, map) {
  if ((method !== 'get' || method != 'post') && !map) {
    map = url
    url = method
    method = 'get'
  }

  if (!map && !url) {
    url = method
    method = 'get'
  }
  let { isApp, timeout: timeout1 } = map || {}
  let ua = isApp ? appUserAgent : userAgent
  let tmout = timeout1 || timeout
  // url = encodeURI(url); 这里引起报错了
  let suag = superagent[method](url)
  suag = setSuperagent(method, suag, map)
  return new Promise((resolve, reject) => {
    suag
      .set('User-Agent', ua)
      .timeout(tmout)
      .end(function (err, res) {
        if (err) {
          console.log(url)
          console.log('-00--0000-------------', err)
          const obj = {
            isTimeout: err.code == 'ETIMEDOUT' || err.code == 'ECONNABORTED',
            is404: err.status == 404 || err.code == 'ENOTFOUND',
            err: err,
          }
          reject(obj)
          return
        }

        resolve(res)
        // setData(['book', 'book5x', id, 'list'], list)
      })
  })
}

function suagentGbk(method, url, map) {
  if ((method !== 'get' || method != 'post') && !map) {
    map = url
    url = method
    method = 'get'
  }

  if (!map && !url) {
    url = method
    method = 'get'
  }
  let { isApp, timeout: timeout1, data = {}, setMap = {} } = map || {}
  let ua = isApp ? appUserAgent : userAgent
  let tmout = timeout1 || timeout
  console.log('setMap', method, setMap)
  return new Promise((resolve, reject) => {
    sendRequest[method](
      url,
      tmout,
      data,
      function (err, text, res) {
        // console.log(a, data)
        if (err) {
          const obj = {
            isTimeout: err.code == 'ETIMEDOUT' || err.code == 'ECONNABORTED',
            is404: err.status == 404 || err.code == 'ENOTFOUND',
            err: err,
          }
          return reject(obj)
        }
        resolve({ text, res })
      },
      'gbk',
      {
        ...setMap,
        'User-Agent': ua,
      },
      'gbk'
    )
  })
}

function suagent(method, url, map, isgbk) {
  let mmar = map
  if ((method !== 'get' || method != 'post') && !map) {
    mmar = url
  }

  if (isgbk || (mmar || {}).isgbk) {
    return suagentGbk(method, url, map)
  }
  return suagentUtf(method, url, map)
}

exports.suagent = suagent

// 存储下载
/* 
{
	manga: {
		showType: {
			id: download
		}
	}
}
 */
const startDownloadMap = {}

exports.setDownload = (bigType, showType, id, val) => {
  startDownloadMap[bigType] = startDownloadMap[bigType] || {}
  startDownloadMap[bigType][showType] =
    startDownloadMap[bigType][showType] || {}
  startDownloadMap[bigType][showType][id] = val
}
exports.getDownload = (...args) => {
  let data = startDownloadMap
  try {
    for (let i = 0, len = args.length; i < len; i++) {
      data = data[args[i]]
    }
  } catch (e) {
    data = undefined
  }
  // console.log('获取到的downloadmg', data, startDownloadMap)
  return data
}
exports.delDownload = (bigType, showType, id) => {
  delete startDownloadMap[bigType][showType][id]
}

// 获取文件
function getFile(path, { isTxt, isImg }) {
  return new Promise((resolve) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        return resolve({
          // data,
          success: false,
        })
      }
      if (isTxt) {
        data = data.toString()
      }
      if (isImg) {
        data = 'data:image/jpg;base64,' + Buffer.from(data).toString('base64')
      }
      resolve({
        data,
        success: true,
      })
    })
  })
}
function getFiles(paths = [], obj = {}) {
  return Promise.all(paths.map((path) => getFile(path, obj)))
}
exports.getFile = getFile
exports.getFiles = getFiles

exports.trans = function trans(map) {
  var s = ''
  for (var i in map) {
    s += i + '=' + encodeURIComponent(map[i]) + '&'
  }
  return s.slice(0, s.length - 1)
}

exports.execParams = function execParams(text = '') {
  const map = {}
  const parstrStr = text
    .split('var ')
    .filter((it) => (it || '').trim())
    .map((it) => it.replace(/(\"|;|')/gi, ''))
    // .split('=')
    // .map(it => it.trim()))
    .forEach((it) => {
      const [key, val] = it.split('=').map((it) => it.trim())
      map[key] = val.replace(/(\"|;|')/gi, '')
    })

  return map
}
exports.forEachRerverse$list = ($as, dealcb) => {
  for (let i = $as.length; i--; ) {
    const $item = $as.eq(i)
    let m = dealcb($item, i)
    if (m === false) {
      return
    }
  }
}
exports.forEach$list = ($as, dealcb) => {
  for (let i = 0, len = $as.length; i < len; i++) {
    const $item = $as.eq(i)
    let m = dealcb($item, i)
    if (m === false) {
      return
    }
  }
}
exports.filter$list = ($as, dealcb) => {
  let arr = []
  for (let i = 0, len = $as.length; i < len; i++) {
    const $item = $as.eq(i)
    let m = dealcb($item, i)
    if (m) {
      arr.push($item)
    }
  }
  return arr
}

exports.getIdByLastItem = (str = '') => {
  let id = str.split('/').filter((it) => it)
  // console.log(id)
  id = id[id.length - 1].trim()
  return id
}

// 这里要把信息保存一下，不然每次都要重新获取
// 感觉不是非常需要保存啊，因为保存的话要考虑很多情况，而且如果地址变更还得自己改
// exports.getDownloadm3u8ListByUri = getDownloadm3u8ListByUri;
function getDownloadm3u8ListByUri(uri, setMap) {
  console.log('m3u8的最后一层', uri)
  return suagent(uri, {
    setMap,
  }).then(({ text }) => {
    // 有其他格式的文件不止ts
    let list = text
      .split('\n')
      .filter((it) => !!it.trim() && it[0] != '#')
      .map((it) => {
        let a = new URL(it, uri)
        return a.toString()
      })
    return list
  })
}
function getDownloadUrl(href, setMap) {
  console.log('第一层列表获取')
  return new Promise((resolve, reject) => {
    ;(function intor() {
      suagent(href, {
        setMap,
      })
        .then(({ text }) => {
          // console.log(text)
          text = text.split('\n').filter((it) => it)
          let uri = text[text.length - 1]
          let a = new URL(uri, href)
          getResourceType(a)
            .then((saveType) => {
              if (saveType == 'application/vnd.apple.mpegurl') {
                // let m = url.parse(href)
                return resolve(a.toString())
              } else {
                return resolve(href)
              }
            })
            .catch((err) => {
              reject('')
            })
        })
        .catch((er) => {
          console.log('获取第一层失败', er)
          if (er.is404) {
            return reject('')
          }
          intor()
        })
    })()
  })
}
// 获取一部动漫的下载地址
exports.getm3u8DownloadList = function getm3u8DownloadList(href, setMap) {
  return getDownloadUrl(href, setMap).then((uri) => {
    console.log('m3u8视频的下载地址', uri)
    return getDownloadm3u8ListByUri(uri, setMap)
  })
}

// 把tslist合并为一个
function mergeTs2one(bufferList, outputdirpath) {
  return new Promise((resolve, reject) => {
    let dirpath = outputdirpath + '/' + mergeTsName + '.ts'
    fs.writeFile(
      dirpath,
      Buffer.concat(bufferList),
      'binary',
      function (err, res) {
        if (err) {
          // console.log(err)
          return reject(err)
        }
        resolve(dirpath)
      }
    )
  })
}

function readDmTsFile(dirpathm, count) {
  return new Promise((resolve, reject) => {
    fs.readFile(dirpathm + '/' + count + '.ts', function (err, res) {
      if (err) {
        return reject(err)
      }
      resolve(res)
    })
  })
}
function mergeTsByPath(outputdirpath, maxPageCount) {
  let icount = 0
  let resArr = []

  return new Promise((resolve, reject) => {
    function getover() {
      if (icount == maxPageCount) {
        // resolve()
        mergeTs2one(resArr, outputdirpath).then(resolve).catch(reject)
      }
    }
    for (let i = 0; i < maxPageCount; i++) {
      readDmTsFile(outputdirpath, i + 1)
        .then((res) => {
          icount++
          resArr[i] = res
          getover()
        })
        .catch((err) => {
          icount++
          getover()
        })
    }
  })
}

// 将ts合并为一个
exports.mergeTsByPath = mergeTsByPath

exports.getHeaderCookie = (arr = [], onlyval) => {
  // const keyArr = ['domain', 'path', 'expires', 'httponly', 'max-age']
  // const isKey = (str='') => keyArr.indexOf(str.toLowerCase()) != -1;

  let nameMap = {}
  arr.map((it) => {
    let map = {}
    let prevname = ''
    it.split(';').forEach((itm, index) => {
      let [key, val] = itm.split('=')
      key = key.trim()
      if (index == 0) {
        prevname = key
        nameMap[prevname] = {}
        nameMap[prevname].value = val
      } else {
        nameMap[prevname][key] = val
      }

      map[key] = val
    })
    return map
  })
  if (onlyval) {
    let map = {}
    Object.keys(nameMap).forEach((key) => (map[key] = nameMap[key].value))
    return map
  }
  // console.log(tempCookieArr)
  return nameMap
}

exports.transUrlId = (str = '') =>
  str
    .split('/')
    .filter((it) => !!it)
    .join('-')
exports.deTransUrlId = (str = '') =>
  str
    .split('-')
    .filter((it) => !!it)
    .join('/')

/*
 * @params olist: 为主的数组
 */
// 合并config离的列表
exports.mergeList = function mergeList(olist = [], rlist = [], onMergeCb) {
  let map = {}
  let arr = []
  for (let i = 0, len = olist.length; i < len; i++) {
    let item = olist[i]
    map[item.url] = i
    arr.push(item)
  }

  for (let item of rlist) {
    // console.log(map[item.url])
    if (map[item.url] == undefined) {
      arr.push(item)
    } else if (typeof onMergeCb === 'function' && map[item.url] != undefined) {
      arr[map[item.url]] = onMergeCb(arr[map[item.url]], item)
    }
  }
  return arr
}

// 通用的擦书
exports.comVideoFunc = () => {
  var $ = function () {
    return {
      remove() {},
      click() {},
      css() {},
      appendTo() {},
    }
  }
  var document = {
    getElementById() {
      return {
        addEventListener() {},
      }
    },
  }

  return {
    $,
    document,
  }
}
