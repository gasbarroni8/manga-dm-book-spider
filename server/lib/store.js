const fs = require('fs')
const path = require('path')
const INTERVAL_TIME = 300

class Store {
  constructor() {
    this.storePath = path.resolve(__dirname, '../../config.json')
    this.data = this.getFileData()
    this.prevTimeSnapShot = 0
  }
  setFileData() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.data, null, '\t'))
    } catch (e) {
      console.log(e)
    } finally {
    }
  }
  getFileData() {
    let data = {}
    try {
      data = JSON.parse(fs.readFileSync(this.storePath).toString())
    } catch (e) {
      // console.log(e)
    } finally {
      return data
    }
  }
  get(args) {
    let m = args.reduce((d, k) => (d || {})[k], this.data)
    return m
  }
  set(args, val) {
    if (args.length == 0) {
      return
    }
    let data = this.data
    args.slice(0, args.length - 1).forEach((key) => {
      data[key] = data[key] || {}
      data = data[key]
    })
    data[args[args.length - 1]] = val
    const curTime = Date.now()
    if (curTime - this.prevTimeSnapShot >= INTERVAL_TIME) {
      this.setFileData()
      this.prevTimeSnapShot = curTime
    }
  }
  delete(args) {
    let data = this.data
    args.slice(0, args.length - 1).forEach((key) => {
      data[key] = data[key] || {}
      data = data[key]
    })
    delete data[args[args.length - 1]]
  }
}

const store = new Store()

const getData = (args = []) => store.get([...args])
const deleteData = (args = []) => store.delete([...args])
const setData = (args = [], val) => {
  // console.log(args, val)
  store.set([...args], val)
}

exports.getData = getData
exports.setData = setData
exports.deleteData = deleteData

// module.exports = store;
