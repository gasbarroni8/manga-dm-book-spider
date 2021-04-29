const { BOOK, BOOKBXWX } = require('../../../constant')
const { suagent, escapeSpecChart } = require('../../../lib')
const { HOST } = require('./comData')
const cheerio = require('cheerio')

const bigType = BOOK;
const showType = BOOKBXWX

const commonFunction = require('../../../lib/commonFunction');
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;

// 搜索
exports.search = function search (search, pageIndex=1) {
	// search = encodeURIComponent(search)
	// /search.html?searchkey=游戏王
	const url = `${HOST}/search.html`
	console.log(url)
	const date = parseInt(Date.now() / 1000)
	return suagent('post', url, {
		setMap: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'referer': HOST,
			'Cookie': `Hm_lvt_46329db612a10d9ae3a668a40c152e0e=${date}; Hm_lpvt_46329db612a10d9ae3a668a40c152e0e=${date}`
		},
		data: {
			searchtype: 'all',
			searchkey: search
		}
	}).then(({text}) => {
		// return;
		// console.log(text)
		const $ = cheerio.load(text);
		// const total = ($('.yemian').find('.pageinfo').find('strong').eq(1).text())
		const $lis = $('#main').find('#sitembox').find('dl');
		const list = [];
		for (let i = 0, len = $lis.length; i < len; i++) {
			const $item = $lis.eq(i);
			let author = $item.find('.book_other').eq(0).find('span').eq(0).text()
			let name = escapeSpecChart($item.find('dd').eq(0).find('h3').find('a').text());
			let id = $item.find('dt').eq(0).find('a').attr('href').split('/').filter(it => it)
			// console.log(id)
			id = id[id.length - 1].trim()
			list.push({
				id,
				author,
				name,
			})
		}

		return {
			list,
			total: 0
		}
	})
}