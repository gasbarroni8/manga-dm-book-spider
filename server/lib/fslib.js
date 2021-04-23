const fs = require('fs')
const path = require('path')

const fsreaddir = (pathName) => {
  return new Promise((resolve, reject) => {
    fs.readdir(pathName, function (err, files) {
      if (err) {
        reject(err)
      }
      resolve(files)
    })
  })
}

const readAllFilesLengthDepAsync = (pathName) => {
  let dirs = 0
  var readAllFilesLengthDepAs = function (pathName) {
    return fsreaddir(pathName).then((files) => {
      // console.log(files);
      let arr = []
      files.forEach((file) => {
        const data = fs.statSync(path.join(pathName, file))
        // console.log(data)
        if (data.isFile()) {
          dirs++
        } else if (data.isDirectory()) {
          arr.push(readAllFilesLengthDepAs(pathName + '/' + file))
        }
      })
      return Promise.all(arr)
    })
  }
  return readAllFilesLengthDepAs(pathName).then(() => dirs)
}

exports.readAllFilesLengthDepAsync = readAllFilesLengthDepAsync

// 读取该目录下所有文件
exports.readAllFiles = function (pathName) {
  return new Promise((resolve, reject) => {
    fs.readdir(pathName, function (err, files = []) {
      var dirs = []
      ;(function iterator(i) {
        if (i == files.length) {
          resolve(dirs)
          return
        }
        fs.stat(path.join(pathName, files[i]), function (err, data) {
          if (data.isFile()) {
            dirs.push(files[i])
          }
          iterator(i + 1)
        })
      })(0)
    })
  })
}

exports.readAllDirectory = function (pathName) {
  return new Promise((resolve, reject) => {
    fs.readdir(pathName, function (err, files) {
      var dirs = []
      ;(function iterator(i) {
        if (i == files.length) {
          resolve(dirs)
          return
        }
        fs.stat(path.join(pathName, files[i]), function (err, data) {
          if (data.isDirectory()) {
            dirs.push(files[i])
          }
          iterator(i + 1)
        })
      })(0)
    })
  })
}

// 递归获取文件数量
var readAllFilesLengthDep = function (pathName) {
  var files = fs.readdirSync(pathName)
  var dirs = 0
  // console.log(files);
  files.forEach((file) => {
    const data = fs.statSync(path.join(pathName, file))
    // console.log(data)
    if (data.isFile()) {
      dirs++
    } else if (data.isDirectory()) {
      dirs += readAllFilesLengthDep(pathName + '/' + file)
    }
  })
  return dirs
}

exports.readAllFilesLengthDep = (pathName) => {
  let count = 0
  try {
    count = readAllFilesLengthDep(pathName)
  } catch (e) {
    // console.log('readAllFilesLengthDep error', e)
  }
  return count
}

// 创建文件夹
const dirCache = {}
function mkdir(filepath) {
  // filepath = path.resolve(__dirname, filepath);
  if (!dirCache[filepath] && !fs.existsSync(filepath)) {
    var pathtmp
    dirCache[filepath] = true
    filepath.split('/').forEach(function (dirname) {
      if (pathtmp) {
        pathtmp = path.join(pathtmp, dirname)
      } else {
        //如果在linux系统中，第一个dirname的值为空，所以赋值为"/"
        if (dirname) {
          pathtmp = dirname
        } else {
          pathtmp = '/'
        }
      }
      if (!fs.existsSync(pathtmp)) {
        if (!fs.mkdirSync(pathtmp)) {
          return false
        }
      }
    })
  }
  return true
}

exports.selfmkdir = mkdir

// 删除文件
function deleteFile(delPath, direct) {
  delPath = direct ? delPath : path.join(__dirname, delPath)
  try {
    /**
     * @des 判断文件或文件夹是否存在
     */
    if (fs.existsSync(delPath)) {
      fs.unlinkSync(delPath)
    } else {
      console.log('inexistence path：', delPath)
    }
  } catch (error) {
    console.log('del error', error)
  }
}
// 删除文件夹
function deleteFolder(delPath) {
  try {
    if (fs.existsSync(delPath)) {
      const delFn = function (address) {
        const files = fs.readdirSync(address)
        for (let i = 0; i < files.length; i++) {
          const dirPath = path.join(address, files[i])
          if (fs.statSync(dirPath).isDirectory()) {
            delFn(dirPath)
          } else {
            deleteFile(dirPath, true)
          }
        }
        /**
         * @des 只能删空文件夹
         */
        fs.rmdirSync(address)
      }
      delFn(delPath)
      return true
    } else {
      console.log('do not exist: ', delPath)
    }
  } catch (error) {
    console.log('del folder error', error)
  }
}

exports.deleteFolder = deleteFolder

// 保存文本
const saveTxt = function (path, txt) {
  return new Promise((resolve) => {
    fs.writeFile(path, txt, (err) => {
      // fs.writeFile('F:\qh\whole', data.reduce((p, total) => p + total, ''), err => {
      if (err) {
        resolve({ success: false })
        return
      }
      resolve({ success: true })
    })
  })
}
exports.saveTxt = saveTxt
