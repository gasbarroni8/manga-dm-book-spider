/*
* @author: neos55555
 */
// const path = require('path')
const cheerio = require('cheerio')
const AllDownload = require('../../../lib/AllDownload')
const { saveFile, setRandTimeout, selfmkdir, escapeSpecChart, suagent, trans, execParams, getRand } = require('../../../lib')
let { getMgOutput, setMgData, getMgData, deleteMgData, showType } = require('./function.js')
const { HOST } = require('./comData')



class Download extends AllDownload {
	// url = 
	constructor (id) {
		super(id)		// 这个是漫画目录
		this.showType = showType;
		this.setMgData = setMgData;
		this.getMgData = getMgData;
		this.deleteMgData = deleteMgData;
		this.getMgOutput = getMgOutput;
		// this.folderName = getMgData([this.id, 'extend1'])
		this.getListUrl = HOST + '/comic/'+this.id+'/'
		// this.isApp = true;
	}

	downLackByListCb (pageIndex, lackMgIndex) {
		return this.getImgByMgIndex(pageIndex, lackMgIndex, true)
	}

	// 解析列表并返回
	execList (text) {
		const that = this;
		
		const $ = cheerio.load(text)

		
		// const name = escapeSpecChart($('.book_newtitle').text());
		const list = []
		const $as = $('#chapterList').find('.item')
		const map = {}
		
		for (let i = $as.length;i--;) {
			const $item = $as.eq(i)
			let title = escapeSpecChart($item.text().replace(/\s|(（.+）)/ig, ''));
			if (map[title] !== undefined) {
				map[title]++;
				title += map[title]
			} else {
				map[title] = 0;
			}
			list.push({
				url: $item.attr('data-id'),
				title,
				// maxPageCount: parseInt($item.find('span').text().replace(/（|）/ig, ''))
			})
		}

		const obj = {
			// id: that.id,
			// name,
			unclearTotal: true,
			list,
		}

		return obj;
	}
	// list中某一个
	getMaxPageCount ({ url }, pageIndex) {
		return this.getPicList(url).then(picList => {
			this.list[pageIndex].picList = picList;
			return picList.length
		})
	}
	getPicList (urlAsId) {

		
		const urlpath = this.getListUrl+urlAsId+'.html'
		
		return suagent(urlpath, {
			setMap: {
				Referer: this.getListUrl
			}
		}).then(({text}) => {
			const $ = cheerio.load(text)
			var html = $('.comiclist').find('script').html();
			
			const res = eval(html.replace(/\s|\n|_czc.push\(cnzz_comic\)/ig, '').match(/\(.+\)/g)[0]) || {}
			// console.log(res)
			return res.chapter_list_all || [];
		})
	}
	
	// 获取第几话中，第几页的漫画
	async getImgByMgIndex (pageIndex, mgIndex) {
		let { url, maxPageCount, title, picList } = this.list[pageIndex];
		if (!picList) {
			try {
				picList = await this.getPicList(url)
				this.list[pageIndex].picList = picList;
			} catch (err) {
				picList = []
			}
		}
		
		const that = this;
		console.log(`开始下载第${pageIndex}话，第${mgIndex}页漫画`)
		
		return new Promise((resolve, reject) => {

			// return;
			if (mgIndex > maxPageCount) {
				resolve({code: 'ok'})
				return;
			}
			if (that.isStop()) {
				return reject('stop');
			}

			const dirpath = that.dirpath+'/'+title
			selfmkdir(dirpath)
			// 
			setRandTimeout(() => {
				saveFile(
					encodeURI(picList[mgIndex-1]), 
					dirpath,
					mgIndex,
					'jpg',
					HOST
				).then(res => {
					that.errorCount = 0;
					console.log('图片保存成功！')
					that.onSaveSuccess && that.onSaveSuccess.call(that, ++that.downloaded)
					resolve({code: 'ok'})
				}).catch(err => {
					that.errorCount++;
					console.log('保存图片失败')
					console.log(err)
					if (err.is404) {	// 没有这一页，所以改成成功
						that.addCount404(pageIndex, mgIndex)
					}
					resolve({code: 'err'})
				})
	
			})
				
		})
	}

}

module.exports = Download;


