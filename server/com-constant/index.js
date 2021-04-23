const { version } = require('../../package.json')

const MANGA = 'manga'
const BOOK = 'book'
const DONGMAN = 'dongman'
const DIANSHIJU = 'dianshiju'

const bigTypeMap = {
  MANGA,
  BOOK,
  DONGMAN,
  DIANSHIJU,
}

const bigTypeArr = Object.keys(bigTypeMap).map((key) => bigTypeMap[key])

const OUTPUT = 'output'
const SETTING = 'setting'

// 各种设置

// book
const MANGA_LIST_OBJ = [
  {
    key: 'mangabz',
    preOutput: 'MANGABZ',
    name: 'mangabz(慢)',
  },
  {
    key: 'mangadm5',
    preOutput: 'MANGADM5',
    name: 'manga5(较快)',
  },
  {
    key: 'mangafzdm',
    preOutput: 'MANGAFZDM',
    name: 'manga6(较快)',
  },
  {
    key: 'mangaacg',
    preOutput: 'MANGAACG',
    name: 'mangaAcg(快)',
  },
  {
    key: 'manga90',
    preOutput: 'MANGA90',
    name: '90mh(较快)',
  },
  {
    key: 'mangalaimh',
    preOutput: 'MANGA_LAIMH',
    name: '来漫画',
  },
  /* {
    key: 'imanhua',
    preOutput: 'MANGA_IMH',
    name: 'iManga[中日]'
  }, */
  {
    key: 'manhualangyu',
    preOutput: 'MANHUA_LANGYU',
    name: 'langyu漫画',
  },
]

const BOOK_LIST_OBJ = [
  {
    key: 'bookbxwx',
    preOutput: 'BOOKBXWX',
    name: '笔下文学',
  },
  {
    key: 'book5x',
    preOutput: 'BOOK5X',
    name: '无限小说',
  },
]

const DSJ$DM = [
  {
    key: 'ddt',
    preOutput: 'DM_DOUTHE',
    name: '豆豆电影(部分不可观看)',
  },
  {
    key: 'kkw',
    preOutput: 'DSJ_KKW',
    name: '看看屋',
  },
  {
    key: 'dsjpanku',
    preOutput: 'DSJ_PIANKU',
    name: '片库',
  },
]

const DM_LIST_OBJ = [
  {
    key: 'dmyinghua',
    preOutput: 'DM_YINGHUA',
    name: '樱花动漫',
  },
  {
    key: '76tv',
    preOutput: 'DM_7666TV',
    name: '樱花tv动漫',
  },
  {
    key: 'km',
    preOutput: 'DM_KDM',
    name: '看动漫',
  },
  {
    key: 'afu',
    preOutput: 'DM_AGEFUNS',
    name: 'age动漫(不稳定)',
  },
  {
    key: 'ddm',
    preOutput: 'DM_DOUDM',
    name: 'ddm动漫',
  },
  {
    key: 'ffdm',
    preOutput: 'DM_FZDM',
    name: '风之动漫',
  },
  ...DSJ$DM,
]

const DSJ_LIST_OBJ = [
  {
    key: 'domp',
    preOutput: 'DSJ_DOMP4',
    name: 'domp',
  },
  ...DSJ$DM,
]

// 每样 最多只能下载一个
const MAX_DOWNLOAD_COUNT = 1
// 最多能够连续失败200次
const MAX_DOWNLOAD_ERROR_COUNT = 100

// key对应的名称
const TYPE_NAME_MAP = {}
const MANGA_MAP = {}
const BOOK_MAP = {}
const DM_MAP = {}
const DSJ_MAP = {}

MANGA_LIST_OBJ.forEach(({ key, name, preOutput }) => {
  TYPE_NAME_MAP[key] = name
  MANGA_MAP[preOutput] = key
})
BOOK_LIST_OBJ.forEach(({ key, name, preOutput }) => {
  TYPE_NAME_MAP[key] = name
  BOOK_MAP[preOutput] = key
})
DM_LIST_OBJ.forEach(({ key, name, preOutput }) => {
  TYPE_NAME_MAP[key] = name
  DM_MAP[preOutput] = key
})
DSJ_LIST_OBJ.forEach(({ key, name, preOutput }) => {
  TYPE_NAME_MAP[key] = name
  DSJ_MAP[preOutput] = key
})

const MANGA_LIST = MANGA_LIST_OBJ.map((it) => it.key)
const BOOK_LIST = BOOK_LIST_OBJ.map((it) => it.key)
const DM_LIST = DM_LIST_OBJ.map((it) => it.key)
const DSJ_LIST = DSJ_LIST_OBJ.map((it) => it.key)

const ALL_LIST = [...MANGA_LIST, ...BOOK_LIST, ...DM_LIST, ...DSJ_LIST]

const isDev = process.env.NODE_ENV === 'development'
const API_URL = isDev ? '/api' : ''
const FILE_URL = API_URL + '/file'

const DEF_OBJ = {
  version,
  mergeTsName: 'mergeTs',
  ...bigTypeMap,
  bigTypeArr,
  API_URL,
  FILE_URL,
  OUTPUT,
  SETTING,

  TYPE_NAME_MAP,
  MAX_DOWNLOAD_COUNT,
  MAX_DOWNLOAD_ERROR_COUNT,

  ...MANGA_MAP,
  ...BOOK_MAP,
  ...DM_MAP,
  ...DSJ_MAP,

  MANGA_LIST,
  BOOK_LIST,
  DM_LIST,
  DSJ_LIST,
  ALL_LIST,

  FOREVER: 'forever',
  VIDEO_LIST: [...DM_LIST, ...DSJ_LIST],
}

module.exports = DEF_OBJ
/* if (typeof module !== 'undefined') {
  module.exports = DEF_OBJ
} else if (typeof export !== 'undefined') {
  // export1
} */
