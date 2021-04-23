const { MANGA, MANGADM5 } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart } = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA;
const showType = MANGADM5

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (name, page=1) => {
	var atr = '&language=1';
	// const domain = 'mangabz.com'
	// const [err, ip] = await getDomainIp(domain)
	var url = HOST+'/search/?title='+encodeURIComponent(name)+atr;
	return new Promise((resolve, reject) => {

		suagent(url, {
			setMap: {
				'Referer': HOST
			}
		})
			.then(({text}) => {
				// console.log(res.text)
				var $ = cheerio.load(text)
				var $as = $('.mh-list').find('li')

				var list = [];
				// 这个特殊一些
				const $topItem = $('.banner_detail_form')
				const $a = $topItem.find('.info .title').find('a')
				
				list.push({
					id: $a.attr('href').replace(/\//ig, ''),
					name: escapeSpecChart($a.text()),
					cover: $topItem.find('.cover img').attr('src'),
				})

				// 
				for (let i = 0, len = $as.length;i < len; i++) {
					var $item = $as.eq(i).find('.mh-item-tip')
					list.push({
						id: $item.find('a').eq(0).attr('href').replace(/\//ig, ''),
						name: escapeSpecChart($item.find('.title a').text()),
						cover: $item.find('.mh-cover').attr('style').replace(/background-image\:(.+)url\(|\)/ig, ''),
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