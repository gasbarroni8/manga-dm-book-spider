const { BOOK_LIST, MANGA_LIST, VIDEO_LIST } = require('../com-constant')

exports.isBook = (showType) => BOOK_LIST.indexOf(showType) !== -1
exports.isManga = (showType) => MANGA_LIST.indexOf(showType) !== -1
exports.isVideoType = (showType) => VIDEO_LIST.indexOf(showType) !== -1

// 是否是可以出现清除按钮的状态
function isShowLock(item) {
  let status = itemStatus(item)
  switch (status) {
    // 无法枷锁
    case 'locked':
      return true
    case 'useless':
      return true
    case 'over':
      return false
    case 'notover':
      return false
    default:
      return false
  }
}

function itemStatus(it) {
  return it.disabled
    ? 'locked'
    : it.isOver
    ? it.maxPageCount == 0
      ? 'useless'
      : 'over'
    : 'notover'
}
// 加锁
function lockItem(item) {
  let status = itemStatus(item)
  switch (status) {
    // 无法枷锁
    case 'locked':
      return {
        ...item,
        // disabled: false
      }
    case 'useless':
      return {
        ...item,
        disabled: true,
      }
    case 'over':
      return {
        ...item,
        disabled: true,
      }
    case 'notover':
      return {
        ...item,
        disabled: true,
      }
  }
}
// 这个情况也要处理
/* "count404": [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  12,
  14
] */
// 解锁同时清除无用的数据
function unlockItem(item) {
  let status = itemStatus(item)
  switch (status) {
    case 'locked':
      return {
        ...item,
        disabled: false,
      }
    case 'useless':
      return {
        url: item.url,
        title: item.title,
      }
    case 'over':
      return {
        ...item,
        disabled: false,
      }
    case 'notover':
      return {
        ...item,
        disabled: false,
      }
  }
}

exports.isShowLock = isShowLock
exports.itemStatus = itemStatus
exports.lockItem = lockItem
exports.unlockItem = unlockItem
