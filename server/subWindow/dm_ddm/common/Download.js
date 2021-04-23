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
} = require('../../../lib')
let { getMgOutput, setMgData, getMgData, deleteMgData, showType } = require('./function.js')
const { HOST } = require('./comData')
const { parse } = require('path')
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
		this.getListUrl = HOST + '/Home/Index/video_play/'+this.id+'.html';
		this.savePicList = true; 	// 因为这个网站的地址随时都要变更，每次获取都不一样，所以不得不这样做
		this.lastRealCookie = {};
		// this
	}

	downLackByListCb (pageIndex, lackMgIndex) {
		return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex)
	}

	// 解析列表并返回
	execList (text) {
		const that = this;
		
		const $ = cheerio.load(text)
		
		// let downloadLineTemp = parseInt($('#DEF_PLAYINDEX').html());
		// const name = escapeSpecChart($('.book_newtitle').text());
		const list = []
		// let tempList = [];
		const $as = $('.anthology').find('>*')
		// const $namelis = $('.anthology').find('h3')
		let tempMap = {};
		let map = {};
		forEach$list($as, $it => {
			
			if ($it[0].tagName == 'h3') {
				map = {}
				tempMap = {
					// name: '线路'+(idx+1),
					name: escapeSpecChart($it.text()),
					unclearTotal: true,
					arr: []
				};
				list.push(tempMap)

			} else {
				const $a = $it
				let title = escapeSpecChart($a.find('span').text().replace(/\s|(（.+）)/ig, ''));
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
			}
			
		})
		// console.log(getMgData([this.id, 'downloadLine']))
		const obj = {
			// downloadLine,
			// downloadLine: getMgData([this.id, 'downloadLine']) || 0,
			// id: that.id,
			// name,
			unclearTotal: true,
			list,
		}
		// console.log(JSON.stringify(obj, '', '\t'))
		// console.log()
		// this.downloadLine = (downloadLine)

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
		let refuri = `${HOST}/Home/Index/html5/${urlAsId}.html`;
		return new Promise(resolve => {
			execFnloop((next, icount) => {
				suagent(refuri).then(res => {
					const $ = cheerio.load(res.text)
					const iframeSrc = $('#player_iframe').attr('src')
					
					execFnloop((innerNext, inCount) => {
						suagent(iframeSrc).then(res => {
							const $ = cheerio.load(res.text)
							const bigAddress = addHttp($('#video').find('source').attr('src'))
							console.log('ddm的大地址是，', bigAddress)
							resolve(bigAddress)
							
						}).catch(() => {
							if (inCount > 10) {
								resolve()
								return;
							}
							innerNext()
						})
					})

				}).catch(() => {
					if (icount > 10) {
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


module.exports = Download;


