const { DONGMAN, DM_AGEFUNS } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem, execUrlParams, addHttp } = require('../../../lib')
// const superagent = require('superagent')

const bigType = DONGMAN;
const showType = DM_AGEFUNS

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='', page=1) => {
	var url = `${HOST}/search?`
	return suagent(url, {
		data: {
			query: searchval,
			page
		},
		setMap: {
			Referer: HOST
		}
	}).then(({text}) => {
		const $ = cheerio.load(text);
		// console.log(typeof text)
		const $wrapper = $('.blockcontent1');
		const $lis = $wrapper.find('.cell');
		const list = [];
		console.log($lis.length)
		for (let i = 0, len = $lis.length; i < len; i++) {
			const $tmp = $lis.eq(i).find('.cell_poster');

			// let name = escapeSpecChart($item.find('.detail a').text())

			let id = getIdByLastItem($tmp.attr('href'))
			list.push({
				id,
				name: escapeSpecChart($tmp.find('.cell_imform_name').text() || $tmp.find('img').attr('alt')),
				cover: addHttp($tmp.find('img').attr('src')),
			})
		}

		let $mars = $('.blockcontent').eq(0).find('li')
		console.log(list)
		let total = parseInt(execUrlParams($mars.eq($mars.length - 1).find('a').attr('href') || '').page) || 0
		return {
			list,
			total: total * 10,
		}
	})
}


// 推荐列表
