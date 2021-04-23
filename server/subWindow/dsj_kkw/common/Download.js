/*
 * @author: neos55555
 */
const superagent = require('superagent');
const fs = require('fs');
const cheerio = require('cheerio');
const AllDownload = require('../../../lib/AllDownload');
const {
  selfmkdir,
  escapeSpecChart,
  suagent,
  forEach$list,
  linkResourceisOk,
  getIdByLastItem,
  execFnloop,
  addHttp,
  forEachRerverse$list,
  deTransUrlId,
} = require('../../../lib');
let {
  getMgOutput,
  setMgData,
  getMgData,
  deleteMgData,
  showType,
} = require('./function.js');
const { HOST } = require('./comData');
// const url = require('url')

const TIMEOUT = 55000;
// 如果使用pipe，当页面视频还未下载完时，就推出，那么下次检测就会把未下载完的当成已下载

class Download extends AllDownload {
  // url =
  constructor(id) {
    super(id); // 这个是漫画目录
    this.showType = showType;
    this.setMgData = setMgData;
    this.getMgData = getMgData;
    this.deleteMgData = deleteMgData;
    this.getMgOutput = getMgOutput;
    this.isDmType = true;
    this.downloadAllList = [];
    this.getListUrl = HOST + '/' + deTransUrlId(this.id);
    this.savePicList = true; // 因为这个网站的地址随时都要变更，每次获取都不一样，所以不得不这样做
    this.lastRealCookie = {};
    this.disableTLSCerts = true;
    // this
  }

  downLackByListCb(pageIndex, lackMgIndex) {
    return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex);
  }

  // 解析列表并返回
  execList(text) {
    const that = this;

    const $ = cheerio.load(text);
    // const $wrapper = $('.article-related.play_url')
    // const name = escapeSpecChart($('.book_newtitle').text());
    const list = [];
    const $as = $('#detail-list .play-list-box');

    forEach$list($as, ($it, idx) => {
      let tempMap = {
        name: '线路' + (idx + 1),
        // name: escapeSpecChart($it.find('h2').text()),
        unclearTotal: true,
        arr: [],
      };
      // tempMap.name = '线路'
      // let tempList = [];
      let map = {};

      forEach$list($it.find('.play-list').find('a'), ($a) => {
        // const $a = $li.find('a')
        const href = $a.attr('href');
        if (href.indexOf('://') != -1 && href.indexOf('http') != 0) {
          return;
        }
        let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/gi, ''));
        if (map[title] !== undefined) {
          map[title]++;
          title += map[title];
        } else {
          map[title] = 0;
        }
        tempMap.arr.push({
          url: getIdByLastItem(href).replace('.html', ''),
          title,
          // maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
        });
        // tempMap.arr.push(outerArr)
      });
      list.push(tempMap);
    });

    // console.log(getMgData([this.id, 'downloadLine']))
    const obj = {
      // downloadLine: getMgData([this.id, 'downloadLine']) || 0,
      // id: that.id,
      // name,
      unclearTotal: true,
      list: list.filter((it) => it.arr.length != 0),
    };

    return obj;
  }

  getMaxPageCount({ url }, pageIndex) {
    return this.getVideoList(url, pageIndex, this.getTempSetMap({ url })).then(
      (picList) => {
        // this.list[this.downloadLine].arr[pageIndex].picList = picList;
        this.setConfigListItem(pageIndex, 'picList', picList);
        return picList.length;
      }
    );
  }
  getTempSetMap({ url: urlAsId }) {
    return {
      referer: `${HOST}`,
      // cookie: cookieToStr(this.lastRealCookie)
      // cookie: 'fa_c=1; fa_t='+(Date.now() - 178665)+'; t1='+Date.now()+'; t2='+(Date.now() + 7100)+';'
    };
  }
  // 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址
  getVideoBigAddress(urlAsId, pageIndex) {
    // let ma = urlAsId.split('_')
    let that = this;

    // let shtype = this.getListItem(pageIndex).type;
    // console.log('当前视频的格式', shtype, pageIndex);
    // this.lastRealCookie = {};
    // https://www.doudoudm.site/Home/Index/html5/52635.html
    let refuri = `${this.getListUrl}/${urlAsId}.html`;
    return new Promise((resolve) => {
      execFnloop((next, icount) => {
        suagent(refuri, {
          setMap: {
            referer: this.getListUrl,
          },
          disableTLSCerts: true,
        })
          .then((res) => {
            const $ = cheerio.load(res.text);
            let iframeSrc = $('iframe').attr('src');
            console.log(refuri);
            console.log(this.showType, 'iframe地址是', iframeSrc);
            iframeSrc = iframeSrc.split('?id=')[1];
            iframeSrc = decodeURIComponent(iframeSrc);
            resolve(iframeSrc);
          })
          .catch(() => {
            if (icount > 10) {
              resolve();
              return;
            }
            next();
          });
      });
    });
  }

  // 下载当前这一个
}

module.exports = Download;
