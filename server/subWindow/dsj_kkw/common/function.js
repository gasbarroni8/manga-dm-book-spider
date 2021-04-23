const { DIANSHIJU, DSJ_KKW } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem, execUrlParams, addHttp, transUrlId } = require('../../../lib')
// const superagent = require('superagent')

const bigType = DIANSHIJU;
const showType = DSJ_KKW

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='', page=1) => {
	var url = `${HOST}/vod-search`
	return suagent(url, {
		data: {
			s: 'vod-search-wd-'+encodeURIComponent(searchval)+'-p-'+page
		},
		setMap: {
			Referer: HOST + '/vod-search',
			'X-Requested-With': 'XMLHttpRequest',
		},
		disableTLSCerts: true,
	}).then(({text}) => {

		let jsmap = JSON.parse(text)

		const $ = cheerio.load(jsmap.data.ajaxtxt);
		// console.log(typeof text)
		const $lis = $('li');
		const list = [];
		// console.log($lis.length)
		for (let i = 0, len = $lis.length; i < len; i++) {
			const $tmp = $lis.eq(i).find('a').eq(0);
			// let name = escapeSpecChart($item.find('.detail a').text())

			let id = transUrlId($tmp.attr('href'))
			list.push({
				id,
				name: escapeSpecChart($tmp.find('img').attr('alt').replace('点击播放', '').replace(/《|》/ig, '')),
				cover: addHttp($tmp.find('img').attr('src')),
			})
		}

		console.log(list)
		return {
			list,
			total: jsmap.data.count * 10,
		}
	})
}


// 推荐列表
