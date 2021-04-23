/*
* @author: neos55555
 */
const superagent = require('superagent')
const fs = require('fs')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const {  selfmkdir, escapeSpecChart, suagent, forEach$list, getIdByLastItem, getm3u8DownloadList } = require('../../../lib')
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
		this.getListUrl = HOST + '/dm/'+this.id+'.html'
		// this
	}

	downLackByListCb (pageIndex, lackMgIndex) {
		return this.getVideoUrlByMgIndex(pageIndex, lackMgIndex)
	}

	// 解析列表并返回
	execList (text) {
		const that = this;
		
		const $ = cheerio.load(text)

		
		// const name = escapeSpecChart($('.book_newtitle').text());
		const list = []
		const $as = $('.container').find('.tab-content').find('div.tab-pane')
		const $namelis = $('.container .row .nav-tabs').eq(0).find('li')
		
		forEach$list($as, ($it, idx) => {
			let tempMap = {
				// name: '线路'+(idx+1),
				name: escapeSpecChart($namelis.eq(idx).find('a').text()),
				unclearTotal: true,
				arr: []
			};
			// tempMap.name = '线路'
			// let tempList = [];
			let map = {};

			forEach$list($it.find('.sort-list').find('li'), $li => {
				const $a = $li.find('a')
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
			
		})

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
		return this.getVideoList(url, pageIndex, {
			referer: HOST,
		}).then(picList => {
			this.setConfigListItem(pageIndex, 'picList', picList)
			return picList.length
		})
	}

	// 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址，这个是必须要得
	getVideoBigAddress (urlAsId, pageIndex) {
		return new Promise(resolve => {
			if (this.downloadAllList.length > 0) {
				console.log('已经获取了，整部动漫，每章节的下载地址')
				resolve(this.downloadAllList[pageIndex])
			} else {
				getDownloadList(urlAsId).then(downloadAllList => {
					this.downloadAllList = downloadAllList;
					console.log(this.downloadLine, '整部动漫，每章节的下载地址', downloadAllList)
					// 这个就是一部动漫的下载地址
					resolve(downloadAllList[pageIndex])
				});
			}
		})
	}


	getTempSetMap () {
		return {
			referer: HOST
		}
	}
	
	
}
// 根据list里的url获取下载列表，这个是整部动漫视频的下载列表，也就是打大类
function getDownloadList (urlAsId) {
	console.log('m3u8动漫下载大类，是这部', urlAsId)
	let mit = urlAsId.split('-')
	let cbName = 'jQuery111303902946030096681_1612753866481'
	let allListUrl = `${HOST}/ass.php?url=dp&vid=${mit[0]}&vfrom=${mit[1]}&vpart=${mit[2]}&cb=${cbName}&_=${Date.now()}`
	console.log('m3u8动漫下载大类', allListUrl)
	// return;
	return suagent(allListUrl, {
		setMap: {
			Referer: HOST
		},
		timeout: TIMEOUT,
	}).then(({text}) => {
		// console.log(text)
		var dataMap = {s: {}};;
		function jQuery111303902946030096681_1612753866481 (data) {
			dataMap = data;
		}
		eval(text)
		return dataMap.s.video || [];
	})
}






module.exports = Download;


