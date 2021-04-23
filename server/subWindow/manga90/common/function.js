const { MANGA, MANGA90 } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem } = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA;
const showType = MANGA90

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='') => {
	var url = HOST+'/search/?keywords='+encodeURI(searchval);
	return new Promise((resolve, reject) => {

		suagent(url)
			.then(({text}) => {
				// console.log(text)
				var $ = cheerio.load(text)
				var $as = $('.w998 #w0 #contList').find('li')
				console.log($as.length)
				var list = [];
				for (let i = 0, len = $as.length;i < len; i++) {
					var $item = $as.eq(i)
					const name = escapeSpecChart($item.find('.ell').find('a').text())
					list.push({
						id: getIdByLastItem($item.find('.cover').attr('href')),
						name,
						cover: $item.find('.cover').find('img').attr('src'),
					})
					
				}
				// console.log(res.text)
				// return list;
				resolve({
					list,
					total: 0
				})
			})
			.catch(err => {
				// console.log(err)
				reject(err)
				// intor();
			})
	})
}