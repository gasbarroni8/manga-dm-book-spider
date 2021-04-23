const { MANGA, MANGAACG } = require('../../../constant')
const { HOST } = require('./comData')

const cheerio = require('cheerio')
const { suagent, escapeSpecChart } = require('../../../lib')
// const superagent = require('superagent')

const bigType = MANGA;
const showType = MANGAACG

const commonFunction = require('../../../lib/commonFunction')
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach(key => {
	exports[key] = comFunc[key]
})

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval='') => {
	return new Promise((resolve, reject) => {
		suagent('post', `${HOST}/ajax/Common.ashx?op=search`, {
			setMap: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Referer: `${HOST}/search.html?keyword=${encodeURIComponent(searchval)}`
			},
			data: {
				keyword: searchval
			},
			isApp: true,
		})
		.then(({text}) => {
			// console.log(text)
			const res = JSON.parse(text)
			const list = (res.comics || []).map(it => {
				let cover = it.ComicCover || ''
				
				return {
					id: it.FolderName,	// 因为目录都只有一个，所以可以当成id
					name: it.ComicName,
					cover: cover.indexOf('http') != 0 ? 'http:'+cover: cover,
					extend1: it.ComicID,
				}
			});
			
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
exports.recommend = function () {
	return new Promise((resolve) => {
		suagent(HOST, {
			isApp: true,
		}).then(({text}) => {
			const $ = cheerio.load(text);
			const $lis = $('.tuijian_list').find('li');
			const list = [];
			var map = {}
			// 因为第一行是说明，所以去掉
			for (let i = 0, len = $lis.length; i < len; i++) {
				const $item = $lis.eq(i).find('a');
				let folderName = $item.attr('href').split('/').filter(it => it)
				folderName = folderName[folderName.length - 1]

				if (!map[folderName]) {
					map[folderName] = true;
					let cover = $item.find('img').attr('src')
					list.push({
						id: folderName,	
						name: escapeSpecChart($item.find('p').text()),
						cover: cover.indexOf('http') != 0 ? 'http:'+cover: cover,
					})
				}
			}
			resolve({
				list
			})
		}).catch(err => {
			resolve({
				list: []
			})
		})
	})
}