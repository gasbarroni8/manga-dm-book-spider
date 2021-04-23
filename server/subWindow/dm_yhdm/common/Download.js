/*
* @author: neos55555
 */
const superagent = require('superagent')
const fs = require('fs')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {  selfmkdir, escapeSpecChart, suagent, forEach$list, 
	linkResourceisOk, getIdByLastItem,
	execFnloop,
	addHttp,
	forEachRerverse$list,
	deTransUrlId,
} = require('../../../lib')
let { getMgOutput, setMgData, getMgData, deleteMgData, showType } = require('./function.js')
const { HOST } = require('./comData')
// const url = require('url')

const TIMEOUT = 55000;
// 如果使用pipe，当页面视频还未下载完时，就推出，那么下次检测就会把未下载完的当成已下载


class Download extends AllDownload {
	// url = 
	constructor (id) {
		super(id)		// 这个是漫画目录
		this.showType = showType;
		this.setMgData = setMgData;
		this.getMgData = getMgData;
		this.deleteMgData = deleteMgData;
		this.getMgOutput = getMgOutput;
		this.isDmType = true;
		this.downloadAllList = [];
		this.getListUrl = HOST + '/'+deTransUrlId(this.id)+'.html';
		this.savePicList = true; 	// 因为这个网站的地址随时都要变更，每次获取都不一样，所以不得不这样做
		this.lastRealCookie = {};
		this.selfSetMap = {
			Connection: 'keep-alive',
		}
		// this
	}

	downLackByListCb (pageIndex, lackMgIndex) {
		return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex)
	}

	// 解析列表并返回
	execList (text) {
		const that = this;
		
		const $ = cheerio.load(text)
		// const $wrapper = $('.article-related.play_url')
		// const name = escapeSpecChart($('.book_newtitle').text());
		const list = []
		const $as = $('.tabs .movurl ul li')
		
		// forEach$list($as, ($it, idx) => {
			let tempMap = {
				name: '线路1',
				// name: escapeSpecChart($it.find('h2').text()),
				unclearTotal: true,
				arr: []
			};
			// tempMap.name = '线路'
			// let tempList = [];
			let map = {};

			forEach$list($as, $li => {
				const $a = $li.find('a')
				/* if ($li.hasClass('btn')) {
					return;
				} */
				let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/ig, ''));
				if (map[title] !== undefined) {
					map[title]++;
					title += map[title]
				} else {
					map[title] = 0;
				}
				tempMap.arr.push({
					url: getIdByLastItem($a.attr('href')).replace('.html', ''),
					title,
					// maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
				})
				// tempMap.arr.push(outerArr)
			})
			list.push(tempMap)
			
		// })

		// console.log(getMgData([this.id, 'downloadLine']))
		const obj = {
			// downloadLine: getMgData([this.id, 'downloadLine']) || 0,
			// id: that.id,
			// name,
			unclearTotal: true,
			list,
		}

		return obj;
	}

	getMaxPageCount ({ url }, pageIndex) {
		return this.getVideoList(url, pageIndex, this.getTempSetMap({url})).then(picList => {
			// this.list[this.downloadLine].arr[pageIndex].picList = picList;
			this.setConfigListItem(pageIndex, 'picList', picList)
			return picList.length
		})
	}
	getTempSetMap ({url: urlAsId}) {
		return {
			referer: `${HOST}`,
			// cookie: cookieToStr(this.lastRealCookie)
			// cookie: 'fa_c=1; fa_t='+(Date.now() - 178665)+'; t1='+Date.now()+'; t2='+(Date.now() + 7100)+';'
	
		}
	}
	// 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址
	getVideoBigAddress (urlAsId, pageIndex) {
		// let ma = urlAsId.split('_')
		let that = this;

		// let shtype = this.getListItem(pageIndex).type;
		// console.log('当前视频的格式', shtype, pageIndex);
		// this.lastRealCookie = {};
		// https://www.doudoudm.site/Home/Index/html5/52635.html
		let refuri = `${HOST}/v/${urlAsId}.html`;
		return new Promise(resolve => {
			execFnloop((next, count) => {
				suagent(refuri, {
					setMap: this.selfSetMap
				}).then(res => {
					const $ = cheerio.load(res.text)
					// let iframeSrc = $('iframe').attr('src')
					let iframeSrc = 'http://tup.yhdm.io/?vid=' + $('#playbox').attr('data-vid')
					// resolve(iframeSrc)
					console.log(this.showType, '当前的iframe地址是', iframeSrc)
					iframeSrc = iframeSrc.split('?vid=')[1]
					resolve(iframeSrc.split('$')[0])

				}).catch(() => {
					if (count > 10) {
						resolve()
						return;
					}
					next()
				})
			})
			
			
		})
	}

	// 下载当前这一个
	
}


function parseExec (html) {
	var $ = function () {
		return {
			remove () {},
			click () {},
			css () {},
			appendTo () {},
		}
	}
	var document = {
		getElementById () {
			return {
				addEventListener () {}
			}
		}
	}
	var params = {
		video: {}
	};
	var DPlayer = function (p) {
		params = p;
		this.on = function () {}
		this.notice = function () {}
		this.addEventListener = function () {}
	}
	// console.log(html)
	// try {
		eval(html)
		params.video.pic = null;

	// } catch (e) {

	// }
	return params
}


module.exports = Download;


