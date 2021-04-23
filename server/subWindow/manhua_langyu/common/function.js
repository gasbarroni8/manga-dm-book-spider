const { MANGA, MANHUA_LANGYU } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart, getIdByLastItem } = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA;
const showType = MANHUA_LANGYU

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='') => {
	var url = `${HOST}/sort/?key=${encodeURIComponent(searchval)}`
	return new Promise((resolve, reject) => {
		suagent(url, {
			setMap: {
				Referer: url
			}
		})
		.then(({text}) => {
			// console.log(text)
			const $ = cheerio.load(text)
			var $as = $('#comicListBox .comic-list').find('.item')

			console.log($as.length)
			var list = [];
			for (let i = 0, len = $as.length;i < len; i++) {
				var $item = $as.eq(i)
				// console.log($item.find('img').attr('src'))
				list.push({
					id: getIdByLastItem($item.find('.thumbnail').attr('href')),
					name: escapeSpecChart($item.find('.title').find('a').text()),
					cover: $item.find('.thumbnail').find('img').attr('data-src'),
					// cover: $item.find('.thumbnail').find('img').attr('style').match(/\(.+\)/ig)[0].replace(/\(|\)|\"|\"/ig, ''),
				})
				
			}
			
			resolve({
				list
			});
		})
		.catch(err => {
			reject(err)
			// intor();
		})
	})
}


// 推荐列表
