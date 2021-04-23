const { MANGA, MANGABZ } = require('../../../constant')
const { suagent, escapeSpecChart } = require('../../../lib')
const HOST = 'http://www.mangabz.com';
const cheerio = require('cheerio')
const superagent = require('superagent')

const bigType = MANGA;
const showType = MANGABZ

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (name, page=1) => {
	var atr = '&page='+page;
	atr = page <= 1 ? '' : atr
	// const domain = 'mangabz.com'
	// const [err, ip] = await getDomainIp(domain)
	const bzPageSize = 12;
	var url = 'http://www.mangabz.com/search/?title='+encodeURIComponent(name)+atr;
	console.log(url)
	return new Promise((resolve, reject) => {

		superagent
			.get(url)
			/* .connect({
				[domain]: ip,
			}) */
			.timeout(60000)
			.set('Referer', 'http://www.mangabz.com/')
			// .set('User-Agent', 'Mozilla/5.0 (Linux; U; Android 9; zh-cn; MI MAX 3 Build/PKQ1.180729.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/71.0.3578.141 Mobile Safari/537.36 XiaoMi/MiuiBrowser/11.8.12')
			.then(res => {
				// console.log(res.text)
				var $ = cheerio.load(res.text)
				var $as = $('.mh-list').find('li')

				var list = [];
				/* let total = $('.result-title').text().match(/(（.+）)/ig);
				total = total ? Math.ceil(parseInt(total[0].replace(/（|）/ig, '')) *  10 / bzPageSize) : 0 */
				for (let i = 0, len = $as.length;i < len; i++) {
					var $item = $as.eq(i)
					list.push({
						id: $item.find('.title a').attr('href').replace(/\//ig, ''),
						name: escapeSpecChart($item.find('.title').text()),
						cover: $item.find('.mh-cover').attr('src'),
					})
				}
				// console.log(res.text)
				// return list;
				resolve({
					list,
					// total
				})
			})
			.catch(err => {
				// console.log(err)
				reject(err)
				// intor();
			})
	})
}

/* exports.recommend = function () {
	return new Promise((resolve) => {
		suagent(HOST).then(({text}) => {
			const $ = cheerio.load(text);
			const $as = $('.rank-list').find('.list')
			var list = [];
			// 热门排行
			for (let i = 0, len = $as.length;i < len; i++) {
				var $item = $as.eq(i)
				list.push({
					id: $item.find('.rank-item-title').find('a').attr('href').replace(/\//ig, ''),
					name: escapeSpecChart($item.find('.rank-item-title').find('a').text()),
					cover: $item.find('.rank-item-cover').attr('src'),
				})
			}

			console.log(list.length)
			resolve({
				list,
				// total
			})
		}).catch(err => {
			console.log(err)
			resolve({
				list: []
			})
		})
	})
} */