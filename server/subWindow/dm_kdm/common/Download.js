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
		this.getListUrl = HOST + '/'+this.id+'/'
		this.isgbk = true;
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
		const $as = $('.playurl').find('.bfdz').eq(0).find('a')
		
		let tempMap = {
			// name: '线路'+(idx+1),
			name: '线路一',
			unclearTotal: true,
			arr: []
		};
		// tempMap.name = '线路'
		// let tempList = [];
		let map = {};

		forEach$list($as, $a => {
			let title = escapeSpecChart($a.text().replace(/\s|(（.+）)/ig, ''));
			if (map[title] !== undefined) {
				map[title]++;
				title += map[title]
			} else {
				map[title] = 0;
			}
			tempMap.arr.push({
				url: $a.attr('href').split('?')[1],
				title,
				// maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
			})
			// tempMap.arr.push(outerArr)
		})
		list.push(tempMap)
			
		console.log('列表如下：', list)
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

	// 获取视频下载的大地址（也就是.mp4或者.m3u8格式的文件地址
	getVideoBigAddress (urlAsId, pageIndex) {
		return new Promise(resolve => {
			if (this.downloadAllList.length > 0) {
				console.log('已经获取了，整部动漫，每章节的下载地址')
				resolve(this.downloadAllList[pageIndex])
			} else {
				getDownloadList(`${HOST}/${this.id}/v.html?${urlAsId}`).then(downloadAllList => {
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
function getDownloadList (uri) {
	// console.log('m3u8动漫下载大类，是这部', urlAsId)

	console.log('m3u8动漫下载大类', uri)
	// return;
	return new Promise((resolve, reject) => {
		suagent(uri, {
			setMap: {
				Referer: HOST
			},
			timeout: TIMEOUT,
		}).then(({text}) => {
			// console.log(text)
			const $ = cheerio.load(text)
			let oursrc = $('#ccplay').find('script').eq(0).attr('src')
			suagent(HOST + oursrc, {
				setMap: {
					Referer: uri
				},
			}).then(({text}) => {
				var VideoListJson = [];
				// 这个是提供给eval里执行的
				var document = {}
				eval(text);
				let list = [];
				if (VideoListJson[0][0] != 'qvod') {
					console.log('沃日嘛，这是快播，下载不了')
					list = VideoListJson[0][1].map(it => it.split('$')[1]);
				}
				resolve(list)
			}).catch(reject)
			
		}).catch(reject)
	})
}




module.exports = Download;


