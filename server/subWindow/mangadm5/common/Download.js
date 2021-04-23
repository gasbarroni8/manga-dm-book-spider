/*
* @author: neos55555
 */
// const path = require('path')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const { getDomainIp, saveFile, setRandTimeout, selfmkdir, escapeSpecChart, suagent, trans, execParams } = require('../../../lib')
let { getMgOutput, setMgData, getMgData, deleteMgData, showType } = require('./function.js')
const { HOST } = require('./comData')

const timeout = 25000;		// 响应超时的时间

var d;

class Download extends AllDownload {
	// url = 
	constructor (id) {
		super(id)
		this.showType = showType;
		this.setMgData = setMgData;
		this.getMgData = getMgData;
		this.deleteMgData = deleteMgData;
		this.getMgOutput = getMgOutput;
		this.getListUrl = HOST + '/'+this.id+'/'
	}

	downLackByListCb (pageIndex, lackMgIndex) {
		return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
	}

	/* getListed () {
		this.dirpath = getMgOutput(this.id)
		selfmkdir(this.dirpath)
		this.downloaded = getMgData([this.id, 'downloadCount']);
		// console.log(this.downloaded)
	} */
	// 解析列表并返回
	execList (text) {
		const that = this;
		
		const $ = cheerio.load(text)
		$('.banner_detail_form .info .title').find('.right').remove()
		const name = escapeSpecChart($('.banner_detail_form .info .title').text());
		const list = []
		const $as = $('#detail-list-select-1').find('li')
		const map = {}
		
		for (let i = $as.length;i--;) {
			const $item = $as.eq(i).find('a')
			let title = escapeSpecChart($item.text().replace(/\s|(（.+）)/ig, ''));
			if (map[title] !== undefined) {
				map[title]++;
				title += map[title]
			} else {
				map[title] = 0;
			}
			list.push({
				url: $item.attr('href').replace(/\//ig, ''),
				title,
				maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
			})
		}

		const obj = {
			id: that.id,
			name,
			list,
		}

		return obj;
		
	}
	// 获取第几话中，第几页的漫画
	getImgByMgIndex (pageIndex, mgIndex) {
		const that = this;
		const { url, maxPageCount, title } = this.list[pageIndex];
		
		console.log(`开始下载第${pageIndex}话，第${mgIndex}页漫画`)
		
		return new Promise((resolve, reject) => {

			var murl = that.getShowUrl(mgIndex, url);
			console.log(murl)
			// return;
			if (mgIndex > maxPageCount) {
				resolve({code: 'ok'})
				return;
			}
			if (that.isStop()) {
				return reject('stop');
			}

			that.getParams(murl).then(params => {
				
				// that.maxMg = that.maxMg || params.MANGABZ_IMAGE_COUNT
				// that.endMg = params.MANGABZ_CURL_END;
				// let maxMg = maxPageCount;
					// params = {...params, MANGABZ_PAGE: mgIndex}
				if (that.isStop()) {
					return reject('stop');
				}
				console.log(Date.now())
				setRandTimeout(() => {
					console.log(Date.now())
					saveImg(murl, params, { 
						dirpath: this.dirpath+'/'+title, 
						ip: this.ip, 
						domain: this.domain }
					).then(res => {
							console.log('continue，继续下一次获取图片');
							that.errorCount = 0;
							// console.log('continue，继续下一次获取图片');
							that.downloaded++
							// console.log('-------------------');
							// console.log(that.onSaveSuccess)
							// console.log('-------------------');
							// setMgData([that.id, 'list', pageIndex, 'isOver'], true)
							that.onSaveSuccess && that.onSaveSuccess.call(that, that.downloaded)
							// that.setPageOver(pageIndex, true)
							resolve({code: 'ok'})
						})
						.catch(err => {
							that.errorCount++;
							if (err.is404) {	// 没有这一页，所以改成成功
								that.addCount404(pageIndex, mgIndex)
							}
							resolve({code: 'err'})
						})
				})
				
			}).catch(err => {
				// ETIMEDOUT
				console.log(err)
				// console.log(err.status)
				if (err.is404) {	// 没有这一页，所以改成成功
					that.addCount404(pageIndex, mgIndex)
				}
				console.log('获取第'+pageIndex+'话'+mgIndex+'图参数失败')
				// console.log('如果看到一大堆失败，不要慌，网站抽了，让程序慢慢跑吧！')
				
				resolve({code: 'err'})
			});
		})
	}

	getShowUrl(cpg, defaultCurl, maxPageCount) {
	    var _url;
	    if (cpg == 1) {
	        _url ='/' + defaultCurl + '/';
	    }/* else if (cpg == maxPageCount) {
	    	_url = this.endMg
	    }*/ else {
	        var croot = defaultCurl+"-p";
	        _url = '/'+croot + cpg + "/";
	    }
	    return HOST + _url;
	}
	/* 
	{
		isVip: 'False',
		DM5_COOKIEDOMAIN: 'dm5.com',
		COMIC_MID: '6604',
		DM5_CURL: '/m190220/',
		DM5_CURL_END: '/m190220-end/',
		DM5_CTITLE: '游戏王5DS 第66话',
		DM5_MID: '6604',
		DM5_CID: '190220',
		DM5_IMAGE_COUNT: '25',
		DM5_USERID: '0',
		DM5_FROM: '%2fm190220%2f',
		DM5_PAGETYPE: '9',
		DM5_PAGEINDEX: '1',
		DM5_PAGEPCOUNT: '1',
		DM5_POSTCOUNT: '1',
		DM5_TIEBATOPICID: '523318',
		DM5_LOADIMAGEURL: 'http://css99tel.cdndm5.com/v202012291638/dm5/images/loading.gif',
		DM5_LOADIMAGEURLW: 'http://css99tel.cdndm5.com/dm5/images/newloading2.gif',
		DM5_LOADIMAGEURLWH: 'http://css99tel.cdndm5.com/dm5/images/newloading3.gif',
		DM5_LOADINGIMAGE: 'http://css99tel.cdndm5.com/v202012291638/dm5/images/loading.gif',
		DM5_READMODEL: '1',
		DM5_CURRENTFOCUS: '1',
		DM5_VIEWSIGN: 'dc486785893e05cf0d5429e9026cd6ae',
		DM5_VIEWSIGN_DT: '2021-01-05 15:28:39'
	}
	*/
	getParams (url) {
		return new Promise((resolve, reject) => {
			var mm = url.split("?")[0];
			var re = /m\d+-p(\d+)\/?/;
			var mat = mm.match(re) || [0, 1];
			// console.log('开始获取图片所需要的参数')
			// console.log(url)
			suagent(url)
				/* .connect({
					[this.domain]: this.ip,
				}) */
				.then(({text}) => {
					// console.log('图片所需要的参数获取成功')
					// console.log(text)
					const $ = cheerio.load(text)
					const $ss = $('head').find('script');
					let html = $ss.eq(9).html()
						.replace('reseturl(window.location.href, DM5_CURL.substring(0, DM5_CURL.length - 1))', '')

						let key = '';
					for (let i = 0, len = $ss.length; i < len; i++) {
						let txt = $ss.eq(i).html()
						if (txt.indexOf('guidkey||dm5_key||val') != -1) {
							key = getKey(txt);
						}
					}

					const params = execParams(html)
					params.DM5_PAGE = parseInt(mat[1])
					params.key = key
					resolve(params)
				})
				.catch(reject)
		})
	}

}


function getKey (txt) {
	var key = ''
	let $ = function (str) {
		return {
			val (a) {
				key = a;
			}
		}
	}
	eval(txt)
	return key
}






function saveImg (url, params, {dirpath, domain, ip}) {
	// console.log(url, params)
	// return;
	return new Promise((resolve, reject) => {
		// var url = 
		const prs = {
			cid: params.DM5_CID, 
			page: params.DM5_PAGE, 
			key: params.key || '', 
			language: 1,
			gtk: 6,
			_cid: params.DM5_CID, 
			_mid: params.DM5_MID, 
			_dt: params.DM5_VIEWSIGN_DT, 
			_sign: params.DM5_VIEWSIGN 
		}

		// selfmkdir(`${dirpath}/${params.MANGABZ_CURL.replace(/\//ig, '')}`)
		console.log('开始获取图片地址')
		/* .connect({
			// [domain]: ip,
		})
		.timeout(timeout) */
		let picUrl = url+'chapterfun.ashx?'+trans(prs)
		console.log(picUrl)
		// return;
		suagent(picUrl, {
			setMap: {
				'Referer': url,
			}
		}).then(function ({text}) {
				// console.log(text)
				eval(text);
				if (!text) {
					reject('error')
					console.log('获取图片地址失败！')
					return;
				}
				// console.log('图片地址如下：')
				// console.log(d)
				// return;
				saveFile(
					encodeURI(d[0]), 
					dirpath,
					// `manga/${params.MANGABZ_CURL.replace(/\//ig, '')}/${params.MANGABZ_CTITLE.replace(/\s/ig, '')}`,
					params.DM5_PAGE,
					'jpg',
					url
				).then(res => {
					console.log('图片保存成功！')
					resolve()
				}).catch(err => {
					console.log('保存图片失败')
					console.log(err.status)
					console.log(err)
					reject(err)
				})

			})
			.catch((err) => {
				console.log(err)
				console.log('获取图片地址失败！')
				reject(err)
				return; 
			})
			
	})
}






module.exports = Download;


