const {
  selfmkdir,
  readAllFiles,
  suagent,
  isBook,
  getFiles,
  saveTxt,
  getOutput,
  saveFile,
  downloadFile,
  getm3u8DownloadList,
  linkResourceisOk,
  getResourceType,
  execByList,
  mergeList,
} = require('./index')
const {
  MAX_DOWNLOAD_ERROR_COUNT,
  MAX_TS_DOWNLOAD_COUNT,
} = require('../constant')
const TIMEOUT = 55000

// const commonFunction = require('./commonFunction');
class AllDownload {
  constructor(id) {
    this.id = id
    this.list = []
    this.dirpath = ''
    this.stopflag = true
    this.errorCount = 0
    this.downloaded = 0
    this.isForceUpdate = false
    this.isNormalUpdate = false
    this.downloadLine = 0
    this.selfSetMap = {}
  }

  addCount404(pageIndex, mgIndex) {
    // title才行，因为5x是没有url的
    // let count = this.getMgData([this.id, 'count404']) || 0;
    // this.setMgData([this.id, 'count404'], count+1)
    let count404Arr = this.list[pageIndex].count404 || []
    if (count404Arr.indexOf(mgIndex) == -1) {
      count404Arr.push(mgIndex)
      this.list[pageIndex].count404 = count404Arr
      this.setMgData([this.id, 'list', pageIndex, 'count404'], count404Arr)
    }
  }
  subtractCount404() {}
  isStop() {
    return this.stopflag
  }
  stop() {
    console.log(this.showType, '进入了暂停，，，')
    this.stopflag = true
  }
  start() {
    this.stopflag = false
  }
  goDownload(startPageIndex = 0, params = {}) {
    const { isForceUpdate, isNormalUpdate, downloadLine = 0, isFirstDownload } =
      params || {}
    this.stop()
    // if (isFirstDownload) {
    // 为什么要加这个，搜索之后下载会带有downline
    this.downloadLine = parseInt(downloadLine) || 0
    console.log(this.showType, '下载的线路是', this.downloadLine)
    // if (this.downloadLine) {	// 因为其他的更新啥的，可能会影响
    this.setMgData([this.id, 'downloadLine'], this.downloadLine)
    // return;
    // }
    // }
    if (isForceUpdate) {
      this.forceStartDownload(startPageIndex)
    } else if (isNormalUpdate) {
      this.updateStartDownload(startPageIndex)
    } else {
      this.normalStartDownload(startPageIndex)
    }
  }
  // 强制下载
  forceStartDownload(startPageIndex) {
    // console.log('强制下载')
    this.deleteMgData([this.id, 'list'])
    this.isForceUpdate = true
    this.startDownloadMg(startPageIndex)
  }
  // 更新下载
  updateStartDownload(startPageIndex) {
    console.log('更新下载')
    this.isNormalUpdate = true
    this.startDownloadMg(startPageIndex)
  }
  // 正常下载
  normalStartDownload(startPageIndex) {
    this.isForceUpdate = false
    this.isNormalUpdate = false
    this.startDownloadMg(startPageIndex)
  }
  // 递归查询该漫画的所有文件夹是否下载完成，已完成就会关闭
  startDownloadMg(startPageIndex) {
    // const that = this;
    this.start()
    this.getList()
      .then((list) => {
        console.log(this.showType, '开始下载哦哦哦哦哦哦哦')
        this.forceCheckAll(startPageIndex)
          .then((txt) => {
            this.stop()
            if (this.isDmType) {
              // console.log('adfasdfasdfasdf')
              this.setMgData(
                [this.id, 'list', this.downloadLine, 'unclearTotal'],
                false
              )
            } else {
              this.setMgData([this.id, 'unclearTotal'], false)
            }
            this.onDone && this.onDone.call(this)
          })
          .catch((errer) => {
            const { code, info, err } = errer
            console.log(errer)
            if (code == 'maxErrorCount') {
              this.errorCount = 0
              this.onMaxError && this.onMaxError.call(this)
            } else {
              this.onStop && this.onStop.call(this, info)
            }
            // this.stop()
            console.log('总的暂停了', code, info, err)
          })
      })
      .catch((err) => {
        // 没有列表，可能没权限
        this.stop()
        console.log(err.info)
        this.onPageError && this.onPageError(err)
      })
  }
  // 是否所有都下载完了
  isAllDownload() {
    let arr = this.isDmType ? this.list[this.downloadLine].arr : this.list
    for (let i = 0, len = arr.length; i < len; i++) {
      if (!arr[i].isOver && !arr[i].disabled) {
        return false
      }
    }
    return true
  }
  getListed(notSetMgData) {
    if (notSetMgData) {
      return
    }
    this.dirpath = this.getMgOutput(this.id)
    selfmkdir(this.dirpath)
    // console.log()
    console.log(
      this.showType,
      '列表获取完毕，此时的downline是什么？',
      this.downloadLine
    )
    let tempDownli = this.getMgData([this.id, 'downloadLine'])
    console.log(this.showType, 'list里的是什么', tempDownli)
    this.downloadLine = tempDownli || 0
    if (this.isDmType) {
      this.downloaded = this.list[this.downloadLine].downloadCount || 0
    } else {
      this.downloaded = this.getMgData([this.id, 'downloadCount']) || 0
    }
    // console.log(this.downloaded)
  }
  getList(notSetMgData) {
    const that = this
    // const [err, ip] = await getDomainIp(this.domain)
    // this.ip = ip;
    // console.log('狗狗狗狗狗狗')
    return new Promise((resolve, reject) => {
      const tempList = that.getMgData([this.id, 'list']) || []
      console.log(
        that.showType,
        'id是',
        this.id,
        '-----',
        '获取缓存中的list长度为',
        tempList.length
      )

      if (tempList.length > 0 && !that.isNormalUpdate) {
        console.log('---tempList---')
        that.list = tempList
        that.getListed(notSetMgData)
        resolve(tempList)
      } else {
        /* function mergeList (olist, list) {
					// let list = obj.list;
					// 不可下载的，到搜索的详情页面会变成可下载。因为是新的，所以可下载新的
					// let orlist = olist.map(it => ({ ...it, isInDownload: it.disabled ? false : true, disabled: undefined }))
			
					let overlen = list.length - olist.length;
					if (overlen <= 0) {
						return olist
					} else {
						return olist.concat(list.slice(olist.length))
					}
					// return list;
					// obj.list = list;
				} */
        that
          .getInternetList()
          .then((obj) => {
            let list = obj.list
            if (that.isNormalUpdate) {
              let olist = that.getMgData([that.id, 'list'])
              if (that.isDmType) {
                list = list.map((it, index) => {
                  return {
                    ...it,
                    arr: mergeList(olist[index].arr, it.arr),
                  }
                })
              } else {
                list = mergeList(olist, list)
              }
              /* let overlen = list.length - olist.length;
						if (overlen <= 0) {
							list = olist
						} else {
							list = olist.concat(list.slice(olist.length))
						} */
            }

            obj.list = list
            if (!notSetMgData) {
              // 不设置数据
              Object.keys(obj).forEach((key) => {
                that.setMgData([that.id, key], obj[key])
              })
            }
            that.list = list
            that.getListed(notSetMgData)
            resolve(list)
          })
          .catch(reject)
      }
    })
  }

  getInternetList() {
    const that = this
    const url = this.getListUrl
    return new Promise((resolve, reject) => {
      console.log(that.showType, '---getList---')
      console.log(url)
      ;(function intor() {
        suagent(url, {
          isApp: that.isApp,
          isgbk: that.isgbk,
          disableTLSCerts: that.disableTLSCerts,
          setMap: {
            ...that.selfSetMap,
          },
        })
          .then(async (res) => {
            const { text } = res
            console.log(that.showType, '查询到数据')
            // console.log(text)
            const obj = await that.execList(text, res)
            if (obj.list.length == 0) {
              that.deleteMgData([that.id])
              reject({
                info: '未查到数据，该作品可能无法在该站进行查看！',
                code: 'nodata',
              })
              return
            }
            // console.log(list)
            // console.log('ooooooo------')
            resolve(obj)
          })
          .catch((err) => {
            console.log('报错了', err)

            console.log(
              that.showType,
              '获取列表失败，网站响应超时，即将再次获取！'
            )
            if (that.isStop()) {
              reject({
                info: '暂停了',
                code: 'stop',
              })
              return
            }
            if (err.is404) {
              // 没有这一页，所以改成成功
              reject({
                info: '该页面不存在',
                code: '404',
              })
              return
            }

            setTimeout(function () {
              intor()
            }, 1099)
          })
      })()
    })
  }

  // 获取最新章节，并且合并到一起，发送给前端当做列表查看页
  getMergetList() {
    function mergeTempList(olist = [], list) {
      // let list = obj.list;
      // 不可下载的，到搜索的详情页面会变成可下载。因为是新的，所以可下载新的
      // 后面+得it.isOver ? true : false目的是，分为了几个线路，所以得分开看
      let orlist = olist.map((it) => ({
        ...it,
        isInDownload: it.disabled ? false : it.isOver ? true : false,
        disabled: undefined,
      }))

      return mergeList(orlist, list)
      // return list;
      // obj.list = list;
    }
    let olist = this.getMgData([this.id, 'list']) || []
    // this.isDmType
    return this.getInternetList().then((obj) => {
      if (this.isDmType) {
        // console.log('原数组', olist, '获取的数组', JSON.stringify(obj.list))
        obj.list = obj.list.map((it, index) => {
          return {
            ...it,
            arr: mergeTempList((olist[index] || {}).arr, it.arr),
          }
        })
      } else {
        obj.list = mergeTempList(olist, obj.list)
      }

      return obj
    })
  }

  // 特别注意--------这里也是需要重写的---
  // 开始下载章节
  //
  startDownloadChapters(uplist) {
    this.stop()
    // let olist = this.list;

    function mergeTempList(olist = [], ulist = []) {
      /* let list = [];
	
			let overlen = ulist.length - olist.length;
			olist.forEach((it, index) => {
				list.push({
					...it,
					disabled: ulist[index].disabled,
					isInDownload: undefined,
				})
			}) */

      return mergeList(
        olist,
        ulist.map((it) => ({
          ...it,
          isInDownload: undefined,
          active: undefined,
        })),
        (oitem, uitem) => {
          return {
            ...oitem,
            disabled: uitem.disabled,
            isInDownload: undefined,
          }
        }
      )
    }
    let tempList = []

    let tmlist = this.list.map((it) => {
      let obj = {
        ...it,
        picList: [],
      }
      if (it.arr) {
        obj.arr = it.arr.map((itm) => {
          let tmp = {
            ...itm,
            picList: [],
          }
          delete tmp.picList
          return tmp
        })
      }
      delete obj.picList
      return obj
    })
    // this.list = list;
    if (this.isDmType) {
      // 如果线路多了呢
      // this.list
      let list = tmlist.concat(uplist.slice(tmlist.length))
      tempList = list.map((it, index) => {
        return {
          ...it,
          arr: mergeTempList(it.arr, (uplist[index] || {}).arr || []),
        }
      })
    } else {
      tempList = mergeTempList(tmlist, uplist)
    }
    this.setMgData([this.id, 'list'], tempList)
    this.normalStartDownload()
    return true
  }

  forceCheckAll(startPageIndex = 0) {
    return new Promise((resolve, reject) => {
      this.forceCheckAllCb(startPageIndex, (res) => {
        const { code, info, err } = res
        if (code == 'done') {
          console.log(this.showType, 'ddone 该漫画已经全部下载完毕')
          resolve(info)
        } else {
          reject(res)
        }
      })
    })
  }
  // 强制检查所有文件
  forceCheckAllCb(startPageIndex = 0, cb) {
    const that = this
    // that.start();
    console.log(that.showType, '开始强制检查文件了')
    if (that.isAllDownload()) {
      console.log(that.showType, '-----------------------------')
      console.log('该漫画已经全部下载完毕')
      console.log('-----------------------------')
      cb && cb({ code: 'done' })
      return
    }

    ;(function intor(pageIndex = 0) {
      console.log(that.showType, '开始检查', pageIndex)
      let len = that.isDmType
        ? that.list[that.downloadLine].arr.length
        : that.list.length
      const item = that.getListItem(pageIndex)
      // console.log(item)
      const { isUnknowPageTotal } = item || {}
      if (pageIndex >= len) {
        console.log(that.showType, '已经检查完一遍')
        that.forceCheckAllCb((startPageIndex = 0), cb)
        return
      }
      if (that.errorCount >= MAX_DOWNLOAD_ERROR_COUNT) {
        that.stop()
        cb && cb({ code: 'maxErrorCount', info: '超过了最大错误下载量' })
        return
      }
      if (that.isStop()) {
        console.log(that.showType, '确确实实暂停了')
        cb && cb({ code: 'stop' })
        return
      }
      // 这里和下面只有stop才能是错误
      if (isUnknowPageTotal) {
        that
          .downloadForUnknow(pageIndex)
          .then(() => {
            console.log(that.showType, '当前章节下载完毕了，进行下一章节下载')
            intor(pageIndex + 1)
          })
          .catch((res) => cb && cb && cb(res))
        return
      }
      // 下载缺页
      that.findLackIndex(pageIndex).then((lackArr, isOver) => {
        console.log('---------------------', pageIndex, lackArr)
        if (lackArr.length) {
          console.log(
            that.showType,
            '查询到第' + pageIndex + '项有缺失，开始下载'
          )
        }
        /* if (isOver) {
					that.isOverCb && that.isOverCb(pageIndex)
				} */
        that
          .downLackByList(pageIndex, lackArr)
          .then((v) => {
            intor(pageIndex + 1)
          })
          .catch((res) => cb && cb && cb(res))
      })
    })(startPageIndex)
  }
  setPageOver(index, flag) {
    this.setConfigListItem(index, 'isOver', flag)
    // 因为对于视频来说,是存了piclist的,所以需要在下载完成的时候删掉
    let picList = this.getListItem(index).picList
    // 因为已经下载完了，所以应该可以观看了
    /* if (flag) {
			this.setConfigListItem(index, 'disabled', false)
		} */
    if (flag && picList && picList.length > 0) {
      try {
        this.delConfigListItem(index, 'picList')
      } catch (e) {
        console.log(this.showType, '删除picList报错了', e)
      }
    }
  }
  setPageDisabled(index, flag) {
    this.setConfigListItem(index, 'disabled', flag)
  }
  // 改变原数组和cofnig里的值，因为数据要实时更新，所以就是一起更新的
  setConfigListItem(pageIndex, key, val) {
    if (this.isDmType) {
      this.list[this.downloadLine].arr[pageIndex][key] = val
      this.setMgData(
        [this.id, 'list', this.downloadLine, 'arr', pageIndex, key],
        val
      )
    } else {
      this.list[pageIndex][key] = val
      this.setMgData([this.id, 'list', pageIndex, key], val)
    }
  }
  // 删除
  delConfigListItem(pageIndex, key) {
    if (this.isDmType) {
      delete this.list[this.downloadLine].arr[pageIndex][key]
      this.deleteMgData([
        this.id,
        'list',
        this.downloadLine,
        'arr',
        pageIndex,
        key,
      ])
    } else {
      delete this.list[pageIndex][key]
      this.deleteMgData([this.id, 'list', pageIndex, key])
    }
  }

  getListItem(pageIndex) {
    // console.log(this.isDmType, this.list)
    return this.isDmType
      ? this.list[this.downloadLine].arr[pageIndex]
      : this.list[pageIndex]
  }
  getChapterFilesArr(pageIndex) {
    const downloadLineName = this.isDmType
      ? this.list[this.downloadLine].name
      : ''
    const item = this.getListItem(pageIndex)
    const { title } = item
    const dirpath = downloadLineName
      ? `${this.dirpath}/${downloadLineName}/${title}`
      : `${this.dirpath}/${title}`
    return readAllFiles(dirpath).then((filesNameArr = []) => {
      console.log(
        this.showType,
        '文件地址：',
        dirpath,
        '。文件数量：',
        filesNameArr.length
      )
      filesNameArr = filesNameArr.map((it) => parseInt(it.split('.')[0]))
      filesNameArr.sort((a, b) => a - b)
      return filesNameArr
    })
  }
  // 找到某一篇章，里面缺少几页书籍或者几张图片
  findLackIndex(pageIndex) {
    // if () {
    const item = this.getListItem(pageIndex)
    const that = this
    let downloadLineName = this.isDmType
      ? this.list[this.downloadLine].name
      : ''

    return new Promise((resolve, reject) => {
      if (!item) {
        console.log(that.showType, '不存在')
        resolve([])
        return
      }

      let {
        maxPageCount,
        isOver,
        title,
        disabled,
        count404 = [],
        incurMgIndex,
      } = item
      if (isOver || disabled) {
        resolve([], isOver)
        console.log(that.showType, '第' + pageIndex + '话已经下载完毕')
        return
      }
      let dirpath = downloadLineName
        ? `${that.dirpath}/${downloadLineName}/${title}`
        : `${that.dirpath}/${title}`

      selfmkdir(dirpath)
      console.log(that.showType, '找到缺少', pageIndex)

      const execResolve = (maxPageCount) => {
        return new Promise((resolveFn) => {
          readAllFiles(dirpath).then((filesNameArr = []) => {
            console.log(
              that.showType,
              '文件地址：',
              dirpath,
              '。文件数量：',
              filesNameArr.length
            )
            filesNameArr = filesNameArr.map((it) => parseInt(it.split('.')[0]))
            filesNameArr.sort((a, b) => a - b)

            var lackArr = []
            var a = 1,
              b = 0
            while (a <= maxPageCount) {
              if (filesNameArr[b] === a) {
                b++
              } else {
                if (count404.indexOf(a) == -1) {
                  // 404的图片是没有必要放到里面再次下载的
                  lackArr.push(a)
                }
              }
              a++
            }
            if (lackArr.length === 0) {
              if (!that.getListItem(pageIndex).isOver) {
                that.setPageOver(pageIndex, true)
              }
              // that.list[pageIndex].isOver = true;
              // that.setMgData([that.id, 'list', pageIndex, 'isOver'], true)
            }
            if (incurMgIndex != null) {
              lackArr.push(incurMgIndex)
            }
            resolveFn(lackArr)
          })
        })
      }
      if (isBook(that.showType) && maxPageCount == null) {
        maxPageCount = 1
      }

      if (maxPageCount == null && that.getMaxPageCount) {
        console.log(that.showType, '没有count，所以需要加载')
        that
          .getMaxPageCount(item, pageIndex)
          .then((maxPageCount) => {
            console.log(that.showType, '所以count是', maxPageCount)

            that.setConfigListItem(pageIndex, 'maxPageCount', maxPageCount)
            // that.list[pageIndex].maxPageCount = maxPageCount;
            // that.setMgData([that.id, 'list', pageIndex, 'maxPageCount'], maxPageCount)

            execResolve(maxPageCount).then((res) => resolve(res))
          })
          .catch((err) => {
            console.log(
              that.showType,
              '获取maxPageCount,报错了',
              err.is404 ? '404' : '不是404',
              err
            )
            if (err.is404) {
              // 因为最大页数获取为404，所以这一章节的漫画就是空的
              that.setPageOver(pageIndex, true)
              // 如果设置为disabled 是不会更新的，有待商榷是否这么写。但是这么写的话，展示是不会拿到的
              that.setPageDisabled(pageIndex, true)
            }
            // console.log('报错了？？？？？？？？？？？？', 'maxPageCount', err)
            resolve([])
          })
      } else {
        execResolve(maxPageCount).then((res) => resolve(res))
      }
    })
  }
  downLackByList(pageIndex, lackArr) {
    const that = this
    if (lackArr.length == 0) {
      return Promise.resolve('ok')
    }
    // 下载某些小说或图片时，是否有错误，如果全都没错，都下载完成。那么就可以setPageOver
    let isSomeMgIndexError = false

    function overdown() {
      if (lackArr.length > 0) {
        console.log(that.showType, '已过滤完第' + pageIndex + '话缺页')
      }
      console.log(that.showType, 'lack over')

      if (!isSomeMgIndexError && that.getListItem(pageIndex).isOver) {
        console.log(that.showType, '下载完成一章节')
        that.setPageOver(pageIndex, true)
      }
    }

    function downloadByMgIndex(lackMgIndex) {
      //
      return that.downLackByListCb(pageIndex, lackMgIndex).then((v) => {
        if (v.code == 'err') {
          isSomeMgIndexError = true
        }
        return v
      })
    }

    return new Promise((resolve, reject) => {
      // 下载某些小说或图片时，是否有错误，如果全都没错，都下载完成。那么就可以setPageOver
      downloadByMgIndex(lackArr.shift())
        .then(() => {
          execByList(
            lackArr,
            downloadByMgIndex,
            that.isDmType ? MAX_TS_DOWNLOAD_COUNT : 1
          )
            .then((res) => {
              overdown()
              console.log('全部下载完了')

              if (that.isForceUpdate) {
                setTimeout(function () {
                  console.log('isForceUpdate')
                  resolve('ok')
                }, 2500)
              } else {
                // 如果不加延迟的话那么这些任务就会一直卡着页面
                setTimeout(function () {
                  // console.log('isForceUpdate')
                  resolve('ok')
                }, 150)
              }
              // resolve('ok')
            })
            .catch((info) => {
              // 这边只有暂停才是错误
              reject({
                code: 'stop',
                info,
              })
            })
        })
        .catch((info) => {
          // 这边只有暂停才是错误
          reject({
            code: 'stop',
            info,
          })
        })
    })
  }
  downLackByList1(pageIndex, lackArr) {
    const that = this
    return new Promise((resolve, reject) => {
      // 下载某些小说或图片时，是否有错误，如果全都没错，都下载完成。那么就可以setPageOver
      let isSomeMgIndexError = false
      ;(function intor(lackIndex) {
        if (lackIndex >= lackArr.length) {
          if (lackArr.length > 0) {
            console.log(that.showType, '已过滤完第' + pageIndex + '话缺页')
          }
          // if ()
          console.log(that.showType, 'lack over')
          // 这边补这么写，是因为如果，下载的缺页中有失败的，那么到这里结尾会变成成功
          // 那么之后就不会下载了
          /* if (!that.list[pageIndex].isOver) {
						that.setPageOver(pageIndex, true)
					} */
          //  !that.list[pageIndex]
          if (!isSomeMgIndexError && that.getListItem(pageIndex).isOver) {
            console.log(that.showType, '下载完成一章节')
            that.setPageOver(pageIndex, true)
          }
          if (that.isForceUpdate) {
            setTimeout(function () {
              console.log('isForceUpdate')
              resolve('ok')
            }, 2500)
          } else {
            // 如果不加延迟的话那么这些任务就会一直卡着页面
            setTimeout(function () {
              // console.log('isForceUpdate')
              resolve('ok')
            }, 150)
          }

          return
        }

        that
          .downLackByListCb(pageIndex, lackArr[lackIndex], lackArr, lackIndex)
          .then((v) => {
            if (v.code == 'err') {
              isSomeMgIndexError = true
            }
            intor(lackIndex + 1)
          })
          .catch((info) => {
            // 这边只有暂停才是错误
            reject({
              code: 'stop',
              info,
            })
          })
      })(0)
    })
  }
  package() {
    if (isBook(this.showType)) {
      return this.book2package()
    }
  }
  // 小说打包
  book2package() {
    let _this = this
    // 这块已经下载完成，所以就可以直接使用缓存的数据。
    return new Promise((resolve, reject) => {
      this.getList().then((list) => {
        // console.log(this.showType, '列表长度', list.length)
        // this.list[pageIndex]
        let textData = []
        // 因为这是小说，所以默认为1
        ;(function intor(pageIndex) {
          // console.log('开始打包第几页', pageIndex)
          if (pageIndex >= list.length) {
            // if (pageIndex >= 2) {
            // console.log(textData)
            let packageOutput = getOutput() + '/package/' + _this.showType
            selfmkdir(packageOutput)
            saveTxt(
              `${packageOutput}/${_this.getMgData([_this.id, 'name'])}.txt`,
              textData.reduce((txt, cur) => txt + cur, '')
            )
            resolve({ success: true })
            return
          }
          let { title, maxPageCount = 1 } = list[pageIndex]
          // textData[pageIndex] = []

          let filePaths = []
          for (let idx = 0; idx < maxPageCount; idx++) {
            filePaths.push(`${_this.dirpath}/${title}/${idx + 1}.txt`)
          }
          // console.log(filePaths)
          getFiles(filePaths, { isTxt: true }).then((res) => {
            // console.log(res)
            textData[pageIndex] =
              `\n${title}\n` +
              res
                .filter((it) => it.success)
                .map((it) => it.data)
                .join('')
            intor(pageIndex + 1)
          })
        })(0)
      })
    })
  }
  saveVideo({ dirpath, videourl, mgIndex, pageIndex, referer, setMap }) {
    let that = this
    console.log(this.showType, '视频的下载地址是这个', videourl)
    if (!videourl) {
      return Promise.reject({ code: 'err', info: '没有下载地址' })
    }
    let stype = this.getListItem(pageIndex).type
    return new Promise((resolve, reject) => {
      if (stype == 'ts') {
        saveFile(videourl, dirpath, mgIndex, stype, referer, setMap)
          .then((res) => {
            console.log(
              that.showType,
              '---------ts保存成功！----------',
              dirpath
            )
            that.errorCount = 0
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            resolve({ code: 'ok' })
            // that.delConfigListItem(pageIndex, 'incurMgIndex')
          })
          .catch((err) => {
            console.log(that.showType, '.........ts保存失败.........', err)
            that.errorCount++
            // 视频中，暂不考虑这种情况
            /* if (err.is404) {	// 没有这一页，所以改成成功
							that.addCount404(pageIndex, mgIndex)
						} */
            resolve({ code: 'err' })
          })
      } else {
        // 因为这个保存方式跟ts不一样,这个是pipe读入的,会提前创建文件
        // 所以需要这个参数
        if (that.getListItem(pageIndex).incurMgIndex == null) {
          that.setConfigListItem(pageIndex, 'incurMgIndex', mgIndex)
        }
        let videopath = dirpath + `/${mgIndex}.` + stype

        // console.log(dirpath+'/1.'+stype)
        downloadFile(videourl, videopath, setMap)
          .then(() => {
            console.log('视频保存成功！', dirpath)
            that.errorCount = 0
            that.onSaveSuccess &&
              that.onSaveSuccess.call(that, ++that.downloaded)
            resolve({ code: 'ok' })
            that.delConfigListItem(pageIndex, 'incurMgIndex')
          })
          .catch((err) => {
            that.errorCount++
            console.log('视频保存失败', err)
            resolve({ code: 'err', err })
          })
        /* superagent.get(videourl).timeout(TIMEOUT).on('end', () => {
					console.log('视频保存成功！', dirpath)
					that.errorCount = 0;
					that.onSaveSuccess && that.onSaveSuccess.call(that, ++that.downloaded)
					resolve({code: 'ok'})
					that.delConfigListItem(pageIndex, 'incurMgIndex')
				}).on('error', (err) => {
					that.errorCount++;
					console.log('视频保存失败', err)
					resolve({code: 'err'})
				}).pipe(fs.createWriteStream(videopath)) */
      }
    })
  }

  // 根据pageindex获取该集数的信息
  getVideoListByPageIndex(pageIndex) {
    let item = this.getListItem(pageIndex)
    let setMap = this.getTempSetMap && this.getTempSetMap(item)
    return this.getVideoList(item.url, pageIndex, setMap || {}).then(
      (picList) => {
        let { type } = this.getListItem(pageIndex)
        return {
          type,
          picList,
        }
      }
    )
  }
  getOnlineuri(pageIndex) {
    let item = this.getListItem(pageIndex)
    return new Promise((resolve, reject) => {
      this.getVideoBigAddress(item.url, pageIndex).then((dlink) => {
        console.log(this.showType, '在线观看地址是，', dlink)
        if (!dlink) {
          //
          resolve({})
          return
        }

        getResourceType(dlink)
          .then((stype) => {
            resolve({
              stype,
              dlink,
            })
          })
          .catch(() => resolve({}))
      })
    })
  }

  // 获取视频下载列表
  getVideoList(urlAsId, pageIndex, setMap) {
    return new Promise((resolve, reject) => {
      this.getVideoBigAddress(urlAsId, pageIndex).then((dlink) => {
        console.log(this.showType, '章节' + pageIndex + '的下载地址是，', dlink)
        if (!dlink) {
          //
          console.log('下载地址有问题，所以得-----')
          resolve([])
          return
        }

        getResourceType(dlink)
          .then((saveType) => {
            // let saveType = dlink.slice(dlink.lastIndexOf('.')+1)
            // if (saveType == 'm3u8') {
            if (saveType == 'application/vnd.apple.mpegurl') {
              // m3u8格式的文件
              this.setConfigListItem(pageIndex, 'type', 'ts')

              getm3u8DownloadList(dlink, setMap)
                .then((tslist) => {
                  // 各个切片
                  // console.log('各个视频的切片是这个', tslist)
                  resolve(tslist)
                })
                .catch(() => resolve([]))
            } else {
              this.setConfigListItem(pageIndex, 'type', 'neos')
              resolve([dlink])
            }
          })
          .catch(() => resolve([]))
      })
    })
  }

  async getVideoUrlByMgIndex(pageIndex, mgIndex, mmap = {}) {
    const { ingorPiclist } = mmap
    if (this.isStop()) {
      return Promise.reject('stop', '只是暂停')
    }
    const { name } = this.list[this.downloadLine]
    let { url, maxPageCount, title, picList } = this.list[
      this.downloadLine
    ].arr[pageIndex]
    if (!picList || ingorPiclist) {
      try {
        picList = await this.getVideoList(
          url,
          pageIndex,
          this.getTempSetMap({ url })
        )
        this.list[this.downloadLine].arr[pageIndex].picList = picList
      } catch (err) {
        picList = []
      }
    }
    if (picList.length == 0) {
      console.log('.......什么鬼？？？？这个章节的列表为空???')
      return Promise.resolve({ code: 'err' })
    }
    // console.log(picList.length);
    console.log(
      this.showType,
      `开始下载线路${
        this.downloadLine + 1
      }，第${pageIndex}话，第${mgIndex}页漫画`
    )
    const dirpath = this.dirpath + '/' + name + '/' + title
    // console.log('地址有问题吗', dirpath)
    selfmkdir(dirpath)
    // 正在下载当前这一话
    let videourl = picList[mgIndex - 1]
    return new Promise((resolve, reject) => {
      linkResourceisOk(videourl)
        .then((res) => {
          this.saveVideo({
            dirpath,
            videourl,
            mgIndex,
            pageIndex,
            // referer: HOST,
            setMap: this.getTempSetMap && this.getTempSetMap({ url }),
          })
            .then((res) => resolve({ code: 'ok' }))
            .catch((err) => resolve({ code: 'err', err }))
        })
        .catch((err) => {
          console.log(
            this.showType,
            '.........所以应该删除该链接资源.........',
            err
          )
          // 下载地址不管用，所以需用重新获取，那么这个地址就放弃掉
          if (!err.isTimeout) {
            console.log('因为不是超时，所以已经删除了')
            this.delConfigListItem(pageIndex, 'picList')
            this.delConfigListItem(pageIndex, 'maxPageCount')
          }
          // console.log('报错了？？？？？，啥子几把错', err)
          // return;
          resolve({ code: 'err', err })
        })
    })

    // console.log('地址没有问题啊', picList[mgIndex - 1])
  }
}

module.exports = AllDownload
