const { getData, setData } = require('../lib/store')
const {
  getDownload,
  getCoverDirpath,
  getFiles,
  isVideoType,
  setOutput,
  getOutput,
} = require('../lib')
const { SETTING, READ_RECORD } = require('../constant')

// 获取正在下载的列表
function getDownloadingByBigType(bigType) {
  const data = getDownload(bigType) || {}
  const map = {}
  Object.keys(data).forEach((showType) => {
    map[showType] = map[showType] || {}
    Object.keys(data[showType] || {}).forEach((id) => {
      map[showType][id] = !data[showType][id].isStop()
    })
  })
  return map
}

module.exports = {
  // 获取下载路径
  getOgutput() {
    return {
      success: true,
      data: getOutput(),
    }
  },
  setOutput({ output }) {
    setOutput(output)
    return {
      success: true,
      info: '成功',
    }
  },

  // 获取文本列表
  getTxts({ paths = [] }) {
    return getFiles(paths, { isTxt: true })
  },
  // 获取图片列表
  getImgs({ paths = [] }) {
    return getFiles(paths, { isImg: true })
  },
  // 设置-自定义配置-快捷键----********
  setSettingShortcuts({ bigType, data }) {
    // 设置快捷键
    setData([SETTING, bigType, 'shortcuts'], data)
  },
  // 获取----********
  getSettingShortcuts({ bigType }) {
    // 设置快捷键
    return {
      success: true,
      data: getData([SETTING, bigType, 'shortcuts']),
    }
  },
  // 获取所有观看类型列表
  getAllList({ bigType }) {
    const mgMap = getData([bigType]) || {}
    // console.log(text)
    const downloadingMap = getDownloadingByBigType(bigType)
    const list = []
    Object.keys(mgMap).forEach((showType) => {
      let currentIsDm = isVideoType(showType)
      const mgAllMap = mgMap[showType]
      const mgDownloadingMap = downloadingMap[showType] || {}
      Object.keys(mgAllMap).forEach((id) => {
        const mg = mgAllMap[id]
        // console.log(mg)
        let downloadCount = currentIsDm
          ? (
              ((getDownload(bigType, showType, id) || mg).list || [])[
                mg.downloadLine || 0
              ] || {}
            ).downloadCount || 0
          : (getDownload(bigType, showType, id) || {}).downloaded ||
            mg.downloadCount

        list.push({
          ...mg,
          // cover: getCoverDirpath(showType, mg.id),
          cover: getCoverDirpath(showType, mg.id),
          downloadCount,
          bigType,
          showType,
          total: (mg.list || [])
            .filter((it) => !it.disabled)
            .reduce(
              (a, it) =>
                a +
                (it.maxPageCount == null ? 1 : it.maxPageCount) -
                (it.count404 || []).length,
              0
            ),
          isDownloading: mgDownloadingMap[id],
          list: [],
          // 具有下载专线-也就是动漫专用
          downloadLineArr: currentIsDm
            ? (mg.list || []).map((itm) => ({
                name: itm.name,
                isDownloading: mgDownloadingMap[id],
                unclearTotal: itm.unclearTotal || itm.isUnknowTotal,
                downloadCount: itm.downloadCount,
                total: (itm.arr || [])
                  .filter((it) => !it.disabled)
                  .reduce(
                    (a, it) =>
                      a +
                      (it.maxPageCount == null ? 1 : it.maxPageCount) -
                      (it.count404 || []).length,
                    0
                  ),
              }))
            : [],
        })
      })
    })

    return {
      success: true,
      data: list,
    }
  },
  // 获取上次观看的记录
  // 根据id查看当前的记录
  getReadRecordById({ showType, id }) {
    const data = getData(['readRecord', showType, id])
    return data
  },
  // 设置观看记录
  setReadRecord(data) {
    setData([READ_RECORD, data.showType, data.id], data)
    return {
      success: true,
    }
  },
}
