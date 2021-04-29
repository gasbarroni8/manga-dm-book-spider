const { DONGMAN, DM_YINGHUA } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem, execUrlParams, addHttp, transUrlId } = require('../../../lib')
// const superagent = require('superagent')

const bigType = DONGMAN;
const showType = DM_YINGHUA

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='', page=1) => {
	var url = `${HOST}/search/${encodeURIComponent(searchval)}`
	return suagent(url, {
		setMap: {
			// Referer: HOST,
			Connection: 'keep-alive',
		}
	}).then(({text}) => {
		const $ = cheerio.load(text);
		// console.log(typeof text)
		const $wrapper = $('.area');
		const $lis = $wrapper.find('.fire .lpic ul li');
		const list = [];
		for (let i = 0, len = $lis.length; i < len; i++) {
			const $tmp = $lis.eq(i).find('a').eq(0);
			// let name = escapeSpecChart($item.find('.detail a').text())

			let id = transUrlId($tmp.attr('href').replace('.html', ''))
			list.push({
				id,
				name: escapeSpecChart($tmp.find('img').attr('alt')),
				cover: addHttp($tmp.find('img').attr('src')),
			})
		}

		// let $mars = $wrapper.find('.text-center .pagination').eq(0).find('li')
		console.log(list)
		// let total = parseInt($mars.eq($mars.length - 2).text()) || 0
		return {
			list,
			// total: total * 10,
		}
	})
}


// 推荐列表
