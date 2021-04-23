const fs = require('fs')
const path = require('path')
const express = require('express')
const mainFuncActs = require('./mainFuncActs')
const bodyParser = require('body-parser')

const { readAllDirectory, getCoverDirpath } = require('./lib')

const commonEvent = require('./lib/commonEvent')
const app = express()

const port = 9008

// console.log(path.resolve(__dirname, './public'))
app.use(express.static(path.resolve(__dirname, './public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/main/:action', (req, res) => {
  const { action } = req.params
  // const { showType, action, data = '{}' } = req.query
  console.log(req.body)
  const result = mainFuncActs[action](req.body)
  if (typeof result == 'object' && typeof result.then == 'function') {
    result
      .then((data) => {
        res.json(data)
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
        })
      })
  } else {
    res.json(result)
  }
})

// 获取封面
app.get('/cover', (req, res) => {
  const { showType, id } = req.query
  // console.log(getCoverDirpath(showType, id))
  fs.readFile(getCoverDirpath(showType, id), (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-type': 'image/png',
      })
      res.end('nodata')
      return
    }
    res.writeHead(200, {
      'Content-type': 'image/png',
    })
    res.end(data)
  })
})

// 获取
app.get('/file', (req, res) => {
  const { path } = req.query
  fs.readFile(path, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end()
      return
    }
    res.end(data)
  })
})
const subWindowPath = path.resolve(__dirname, './subWindow')
readAllDirectory(subWindowPath).then((list) => {
  // console.log(list)
  // 这里默认引用的index
  const comEvtsMap = {}
  list.forEach((it) => {
    const {
      search,
      recommend,
      bigType,
      showType,
      Download,
      startDownload,
      getMgDownload,
      type,
      start,
    } = require(path.resolve(subWindowPath, './' + it))

    const comEvts = commonEvent({
      bigType,
      showType,
      startDownload(id, params) {
        return startDownload(id, Download, params)
      },
      getMgDownload(id) {
        return getMgDownload(id, Download)
      },
      search,
      recommend,
    })

    comEvtsMap[showType] = comEvts
  })
  emitComEvts(comEvtsMap)
})

function emitComEvts(comEvtsMap) {
  // 编写接口
  app.post('/sub/:showType/:action', (req, res) => {
    const { showType, action } = req.params
    const comEvts = comEvtsMap[showType]
    console.log(req.body)
    const result = comEvts[action](req.body)
    if (typeof result == 'object' && typeof result.then == 'function') {
      result
        .then((data) => {
          res.json(data)
        })
        .catch((err) => {
          res.status(500).json({
            success: false,
          })
        })
    } else {
      res.json(result)
    }
  })
}

app.listen(port)
console.log('listen...', port)
