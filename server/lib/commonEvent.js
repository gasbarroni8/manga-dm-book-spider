// const path = require('path')
// const { ipcMain } = require('electron')
const commonFunction = require('./commonFunction')
const {
  deleteFolder,
  saveFile,
  getCoverOutput,
  selfmkdir,
  getCoverDirpath,
  isVideoType,
  mergeTsByPath,
  lockItem,
  unlockItem,
} = require('./index')

module.exports = ({
  bigType,
  showType,
  startDownload,
  getMgDownload,
  search,
  recommend,
}) => {
  const {
    getMgData,
    getMgOutput,
    setMgData,
    deleteMgData,
    getDownload,
  } = commonFunction(bigType, showType)
  const isVideoLine = isVideoType(showType)

  // 更新下载数量
  /* Object.keys((getMgData() || {})).forEach(id => {
    setTimeout(() => {
      
      updateDownloadCount(id)
    }, 16);
  }) */

  // 保存封面
  function saveCover(id, cover) {
    setAddDate(id)
    const coverDirpath = getCoverOutput()
    if (!coverDirpath) {
      return
    }
    selfmkdir(coverDirpath)
    console.log('--------封面--------', cover)
    if (cover) {
      saveFile(
        cover,
        coverDirpath,
        // `manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`,
        showType + '-' + id,
        'jpg',
        cover
      )
        .then((res) => {
          console.log('封面保存成功---------------')
        })
        .catch((err) => {
          console.log('封面保存失败---------------')
        })
    }
  }
  //
  function transChapterByPageIndex(
    { id, downloadLine, pageIndex, dirpath },
    islock
  ) {
    if (isVideoLine) {
      let item = getMgData([id, 'list', downloadLine, 'arr', pageIndex])

      // arr.splice(pageIndex, 1)
      setMgData(
        [id, 'list', downloadLine, 'arr', pageIndex],
        islock ? lockItem(item) : unlockItem(item)
      )
    } else {
      let item = getMgData([id, 'list', pageIndex])
      // arr.splice(pageIndex, 1)
      setMgData(
        [id, 'list', pageIndex],
        islock ? lockItem(item) : unlockItem(item)
      )
    }
  }
  // 设置添加时间
  function setAddDate(id) {
    if (!getMgData([id, 'addDate'])) {
      setMgData([id, 'addDate'], parseInt(Date.now() / 1000))
    }
  }

  return {
    deleteMg({ id, isDelFiles }) {
      if (isDelFiles) {
        deleteFolder(getMgOutput(id))
      }
      deleteMgData([id])
      return true
    },
    // 获取某本书籍的最新列表，因为是搜索后才出现的，所以需要跟之前的信息做比较
    getMgList({ id }) {
      // 万一正在下载怎么办
      const mgDown = getMgDownload(id)
      return new Promise((resolve) => {
        mgDown
          .getMergetList()
          .then((res) => resolve(res))
          .catch(resolve)
      })
    },
    // 获取某本书籍列表，用于在线观看
    getListForWatch({ id }) {
      // 万一正在下载怎么办
      const mgDown = getMgDownload(id)
      return new Promise((resolve) => {
        mgDown
          .getList(true)
          .then((list) =>
            resolve({
              success: true,
              list,
              downloadLine: mgDown.downloadLine || 0,
            })
          )
          .catch((err) => {
            console.log('getListForWatch', err)
            resolve({
              success: false,
              info: err.info,
            })
          })
      })
    },
    // 获取某部视频的在线播放地址
    getOnlineuri({ id, downloadLine, pageIndex }) {
      // 万一正在下载怎么办
      const mgDown = getMgDownload(id)
      mgDown.downloadLine = downloadLine
      return new Promise((resolve) => {
        mgDown
          .getOnlineuri(pageIndex)
          .then((res) => resolve(res))
          .catch((err) => {
            resolve({
              success: false,
              info: '获取数据失败！',
            })
          })
      })
    },
    // 某本书开始下载选中的章节
    startDownloadChapters({
      id,
      uplist,
      cover,
      name,
      downloadLine,
      extend1,
      extend2,
      extend3,
      unclearTotal,
    }) {
      saveCover(id, cover)
      setMgData([id, 'name'], name)
      setMgData([id, 'id'], id)
      downloadLine && setMgData([id, 'downloadLine'], downloadLine)
      extend1 && setMgData([id, 'extend1'], extend1)
      extend2 && setMgData([id, 'extend2'], extend2)
      extend3 && setMgData([id, 'extend3'], extend3)
      unclearTotal && setMgData([id, 'unclearTotal'], unclearTotal)
      console.log('基础设备已经设置完毕')
      const mgDown = getDownload(id)
      downloadLine && (mgDown.downloadLine = downloadLine)
      // console.log(uplist.length)
      return mgDown.startDownloadChapters(uplist)
    },
    // 漫画搜索
    search({ searchval, pageIndex }) {
      return search(searchval, pageIndex)
    },
    // 推荐漫画
    recommend() {
      if (recommend) {
        return recommend()
      }
      return {
        list: [],
      }
    },
    // 获取某个漫画的详细信息
    getOneDetail({ id }) {
      // return getFile(getCoverDirpath(showType, id), { isImg: true }).then(res => {
      const item = getMgData([id])

      return {
        cover: getCoverDirpath(showType, id),
        output: getMgOutput(id),
        ...item,
        list: isVideoLine
          ? item.list
          : // ? item.list.map(itm => ({ ...itm, arr: itm.arr.filter(it => !it.disabled) }))
            item.list,
        // : item.list.filter(it => !it.disabled)
      }
      // })
    },
    // 合并ts-只有视频才有这个用
    mergeTsByPath({ id, dirpath, pageIndex }) {
      // 设置快捷键
      if (!dirpath) {
        return
      }
      let mgItem = getMgData([id])
      let downloadLine = mgItem.downloadLine || 0

      let item = mgItem.list[downloadLine].arr[pageIndex]

      if (item.isOver) {
        if (item.isMerged) {
          return {
            success: true,
            info: '直接用',
          }
        }
        return new Promise((resolve) => {
          mergeTsByPath(dirpath, item.maxPageCount)
            .then((res) => {
              setMgData(
                [id, 'list', downloadLine, 'arr', pageIndex, 'isMerged'],
                true
              )
              resolve({
                success: true,
                res,
              })
            })
            .catch((err) => {
              console.log('合并视频失败', err)
              resolve({
                success: false,
                info: '未知错误',
              })
            })
        })
      } else {
        return {
          success: false,
          info: '视频未下载完成，无法查看！',
        }
      }
    },
    // 重置动漫的，某一个章节，
    resetChapterByPageIndex(data) {
      transChapterByPageIndex(data)
      return {
        success: true,
      }
    },
    lockChapterByPageIndex(data) {
      transChapterByPageIndex(data, true)
      return {
        success: true,
      }
    },
    // 重置该漫画的所有不可用章节
    resetAllChapter({ id, downloadLine }) {
      if (isVideoLine) {
        let arr = getMgData([id, 'list', downloadLine, 'arr'])
        setMgData(
          [id, 'list', downloadLine, 'arr'],
          arr.map((it) => {
            const isError = (it.isOver && it.maxPageCount == 0) || it.disabled
            if (isError) {
              return {
                url: it.url,
                title: it.title,
              }
            }
            return it
          })
        )
      } else {
        let list = getMgData([id, 'list'])
        setMgData(
          [id, 'list'],
          list.map((it) => {
            const isError = (it.isOver && it.maxPageCount == 0) || it.disabled
            if (isError) {
              return {
                url: it.url,
                title: it.title,
              }
            }
            return it
          })
        )
      }
      // 不删除的话，万一里面有杂乱数据，就不好半了
      // let success = deleteFolder(dirpath)
      return {
        success: true,
      }
    },
    // 开始下载漫画
    /* 
    isFirstDownload: 是否是在搜索的界面下载的
   */
    startDownload(data) {
      // console.log(data)
      let {
        id,
        name,
        cover,
        downloadLine,
        extend1,
        extend2,
        extend3,
        isFirstDownload,
      } = data
      console.log('下载数据是', data)
      setMgData([id, 'id'], id)
      setMgData([id, 'name'], name)
      downloadLine = parseInt(downloadLine)
      console.log('开始下载了，下载线路是', downloadLine)
      // 下载线路几
      // downloadLine && setMgData([id, 'downloadLine'], downloadLine);
      extend1 && setMgData([id, 'extend1'], extend1)
      extend2 && setMgData([id, 'extend2'], extend2)
      extend3 && setMgData([id, 'extend3'], extend3)
      saveCover(id, cover)

      return startDownload(id, { downloadLine, isFirstDownload })
    },
    // 更新
    update(data) {
      const { id, downloadLine } = data
      // console.log('uuuuuupdate')
      // return;
      // deleteMgData([id, 'list'])
      const success = startDownload(id, {
        isNormalUpdate: true,
        downloadLine: parseInt(downloadLine),
      })
      return {
        success,
      }
    },
    // 强行更新，会删除掉list，然后进行大量的json插入操作，所以耗时较长
    forceUpdate(data) {
      const { id } = data
      // console.log('ffffffffffffforceUpdate')
      // return;
      // deleteMgData([id, 'list'])
      const success = startDownload(id, {
        isForceUpdate: true,
      })
      return {
        success,
      }
    },
    // 暂停漫画
    stopDownload(data) {
      // console.log('只能听',data)
      let success = true
      try {
        getDownload(data.id).stop()
      } catch (e) {
        success = false
      }
      return {
        success,
      }
      // event.sender.send(showType+'-stopDownload-return', data.id)
    },
    // 获某一章节有几页漫画图，或者小说文字
    getOneByTitle({ id, title, downloadLine = 0 }) {
      console.log(showType, 'getOneByTitle', downloadLine)
      const { list = [], name } = getMgData([id]) || {}
      let curDmItem = list[downloadLine]
      let arr = isVideoLine ? curDmItem.arr : list
      let output = getMgOutput(id)

      for (let i = arr.length; i--; ) {
        const item = arr[i]
        if (item.title == title) {
          // console.log('abcdefg')
          return {
            name,
            pageIndex: i,
            output: isVideoLine ? `${output}/${curDmItem.name}` : output,
            ...item,
          }
        }
      }
    },
    // 打包
    toPackage({ id }) {
      const mgDown = getMgDownload(id)
      // console.log(downloadMg)
      return mgDown.package()
    },
  }
}
