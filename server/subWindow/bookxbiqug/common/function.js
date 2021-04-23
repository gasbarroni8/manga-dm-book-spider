const { BOOK, BOOKXBQG } = require('../../../constant')
const { suagent, escapeSpecChart, transUrlId } = require('../../../lib')
const { HOST } = require('./comData')
const cheerio = require('cheerio')

const bigType = BOOK;
const showType = BOOKXBQG

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;

// 搜索
exports.search = function search (searchval, pageIndex=1) {
	// search = encodeURIComponent(search)
	// /search.html?searchkey=游戏王
	// const url = `${HOST}/modules/article/waps.php`
	const url = 'https://www.biquge.lol/ar.php'
		
	console.log(url)
	
	return suagent(url, {
		data: {
			// searchkey: searchval
			keyWord: searchval
		},
		/* setMap: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Referer: url
		} */
	}).then(({text}) => {
		console.log(text)
		const $ = cheerio.load(text);
		/* const $lis = $('#content').find('table').find('tbody').find('tr');
		const list = [];
		// console.log(text)
		// 因为第一行是说明，所以去掉
		for (let i = 1, len = $lis.length; i < len; i++) {
			const $item = $lis.eq(i);

			const $tmp = $item.find('td').eq(0).find('a')
			let name = escapeSpecChart($tmp.text())

			let id = $tmp.attr('href').split('/').filter(it => !!it)
			// console.log(id) 
			id = id.slice(id.length - 2).join('-')
			list.push({
				id,
				author: $item.find('td').eq(2).text().trim(),
				name,
			})
		} */
		// console.log(typeof text)
		const $wrapper = $('.container');
		const $lis = $wrapper.find('ul').find('li');
		const list = [];
		// console.log($lis.length)
		for (let i = 1, len = $lis.length; i < len; i++) {
			const $spans = $lis.eq(i).find('span');

			// let name = escapeSpecChart($item.find('.detail a').text())

			let id = transUrlId($spans.eq(1).find('a').attr('href'))
			list.push({
				id,
				name: escapeSpecChart($spans.eq(1).find('a').text()),
				author: escapeSpecChart($spans.eq(3).text()),
			})
		}

		let $mars = $('.blockcontent').eq(0).find('li')
		console.log(list)
		return {
			list
		}
	})
}