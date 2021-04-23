const { OUTPUT, MAX_DOWNLOAD_COUNT } = require('../constant')
const {
  readAllFilesLengthDepAsync,
  setDownload,
  getDownload,
  delDownload,
  userAgent,
  escapeSpecChart,
  isVideoType,
} = require('./index')
const { getData, setData, deleteData } = require('./store')

const getOutput = () => getData([OUTPUT])
const setOutput = (path) => setData([OUTPUT], path)

// BOOK  BOOK5X
module.exports = function (bigType, showType) {
  const isVideoLine = isVideoType(showType)
  const getMgData = (args = []) => getData([bigType, showType, ...args])
  const setMgData = (args = [], val) =>
    setData([bigType, showType, ...args], val)
  const deleteMgData = (args = []) => deleteData([bigType, showType, ...args])
  const setDownloadById = (id, val) => {
    setDownload(bigType, showType, id, val)
  }
  const getDownloadById = (id) => {
    return getDownload(bigType, showType, id)
  }
  const getDownloadByCurrentShowTye = () => {
    return getDownload(bigType, showType) || {}
  }

  // 根据id获取 mg的 输出路径
  function getMgOutput(id) {
    return (
      getOutput() + `/${showType}/` + getData([bigType, showType, id, 'name'])
    )
  }

  // 更新已下载数量并返回---temp
  const updateDownloadCount = (id) => {
    let filepath = getMgOutput(id)
    // let len = 0;
    console.log('updateDownload', '开始更新下载数量')
    return new Promise((resolve) => {
      let startTime = Date.now()

      if (isVideoLine) {
        let dmObj = getData([bigType, showType, id])
        // console.log(getDownloadById(id))
        let mgd = getDownloadById(id) || {}
        // console.log(mgd)
        let downloadLine =
          mgd.downloadLine == null ? dmObj.downloadLine || 0 : mgd.downloadLine
        let item = (dmObj.list || [])[downloadLine] || {}
        console.log(
          'updateDownload',
          '读取地址是这个',
          filepath + '/' + item.name,
          '。线路分支是',
          downloadLine
        )
        readAllFilesLengthDepAsync(filepath + '/' + item.name).then((len) => {
          console.log(
            'updateDownload',
            '最终可以了',
            len,
            '耗时：',
            Date.now() - startTime
          )
          setData(
            [bigType, showType, id, 'list', downloadLine, 'downloadCount'],
            len
          )
          resolve(len)
        })
        // return ;
      } else {
        readAllFilesLengthDepAsync(filepath).then((len) => {
          console.log(
            'updateDownload',
            '最终可以了',
            len,
            '耗时：',
            Date.now() - startTime
          )
          setData([bigType, showType, id, 'downloadCount'], len)
          resolve(len)
        })
      }
    })
  }
  // 获取当前类型的正在下载的数量
  function getCurrentShowTyeDownloadingCount(escapeId) {
    let count = 0
    const showTypeDownloadInstanceMap = getDownloadByCurrentShowTye() || {}
    Object.keys(showTypeDownloadInstanceMap).forEach((sType) => {
      const downloadInstance = showTypeDownloadInstanceMap[sType]
      if (
        downloadInstance.id !== downloadInstance &&
        !downloadInstance.isStop()
      ) {
        count++
      }
    })
    return count
  }

  function getMgDownload(id, Download) {
    if (getDownloadById(id)) {
      return getDownloadById(id)
    }
    const mgDown = new Download(id)
    mgDown.onSaveSuccess = function (downloadCount) {
      // console.log(this.isStop(), downloadCount)
      if (this.isStop()) {
        return
      }
      console.log(showType, 'updateDownloadCount', id, downloadCount)
    }
    mgDown.onDone = function () {
      delDownload(bigType, showType, id)

      updateDownloadCount(id).then((len) => {
        console.log(showType, 'downloadOver', id, len)
      })
    }
    mgDown.onMaxError = function () {
      console.log(showType, '超过最大错误')
    }
    mgDown.onStop = function () {
      console.log(showType, '暂停了')
    }

    setDownloadById(id, mgDown)
    return mgDown
  }

  // 开始下载
  function startDownload(id, Download, params = {}) {
    // console.log()
    if (getCurrentShowTyeDownloadingCount(id) >= MAX_DOWNLOAD_COUNT) {
      return {
        success: false,
        info: `该网站资源可同时下载量，不可超过${MAX_DOWNLOAD_COUNT}本！`,
      }
    }
    // console.log(id, getDownloadById(id))
    if (!getOutput()) {
      return {
        success: false,
        info: '请先设置下载路径！',
      }
    }
    // 这里是从缓存中获取
    if (getDownloadById(id)) {
      if (getDownloadById(id).isStop()) {
        getDownloadById(id).goDownload(0, params)
        return {
          success: true,
        }
      } else {
        return {
          success: false,
          info: '正在下载',
        }
      }
    }
    // 下载完了再更新数量？
    /* updateDownloadCount(id).then(len => {
    }) */
    const mgDown = getMgDownload(id, Download)
    console.log(params)
    mgDown.goDownload(0, params)

    return {
      success: true,
    }
  }

  return {
    userAgent,
    getMgOutput,
    escapeSpecChart,
    updateDownloadCount,
    setMgData,
    getMgData,
    deleteMgData,
    getData,
    setData,
    getOutput,
    setOutput,
    getCurrentShowTyeDownloadingCount,
    startDownload,
    getMgDownload,

    setDownload: setDownloadById,
    getDownload: getDownloadById,
    /* delDownload (id) {
      delDownload(bigType, showType, id)
    }, */
  }
}
