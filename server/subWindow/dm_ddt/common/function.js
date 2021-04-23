const { DONGMAN, DM_DOUTHE } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem, execUrlParams, addHttp } = require('../../../lib')
// const superagent = require('superagent')

const bigType = DONGMAN;
const showType = DM_DOUTHE

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='', page=1) => {
	var url = `${HOST}/index.php?s=vod-search`
	return suagent('post', url, {
		data: {
			wd: searchval,
			// page: 0
		},
		setMap: {
			Referer: HOST,
			'content-type': 'application/x-www-form-urlencoded'
		}
	}).then(({text}) => {
		const $ = cheerio.load(text);
		// console.log(typeof text)
		const $wrapper = $('.serach-list');
		const $lis = $wrapper.find('.serach-ul li');
		const list = [];
		console.log($lis.length)
		for (let i = 0, len = $lis.length; i < len; i++) {
			const $tmp = $lis.eq(i).find('a');
			// let name = escapeSpecChart($item.find('.detail a').text())

			let id = getIdByLastItem($tmp.attr('href')).replace('.html', '')
			list.push({
				id,
				name: escapeSpecChart($tmp.attr('title')),
				cover: addHttp($tmp.find('img').attr('data-url'), HOST),
			})
		}

		// let $mars = $('.blockcontent').eq(0).find('li')
		// console.log(list)
		// let total = parseInt(execUrlParams($mars.eq($mars.length - 1).find('a').attr('href') || '').page) || 0
		return {
			list,
			// total: total * 10,
		}
	})
}


// 推荐列表
