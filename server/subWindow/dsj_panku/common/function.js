const { DIANSHIJU, DSJ_PIANKU } = require('../../../constant');
const { HOST } = require('./comData');

const cheerio = require('cheerio');
const {
  suagent,
  escapeSpecChart,
  getIdByLastItem,
  execUrlParams,
  addHttp,
  transUrlId,
} = require('../../../lib');
// const superagent = require('superagent')

const bigType = DIANSHIJU;
const showType = DSJ_PIANKU;

const commonFunction = require('../../../lib/commonFunction');
const comFunc = commonFunction(bigType, showType);

Object.keys(comFunc).forEach((key) => {
  exports[key] = comFunc[key];
});

exports.bigType = bigType;
exports.showType = showType;
exports.search = (searchval = '', page = 1) => {
  var url = `${HOST}/s/go.php`;
  return suagent(url, {
    data: {
      q: searchval,
    },
    setMap: {
      Referer: HOST,
    },
    disableTLSCerts: true,
  }).then(({ text }) => {
    const $ = cheerio.load(text);
    console.log(text);
    const $lis = $('.sr_lists dl');
    const list = [];
    console.log($lis.length);
    for (let i = 0, len = $lis.length; i < len; i++) {
      const $tmp = $lis.eq(i).find('a').eq(0);
      // let name = escapeSpecChart($item.find('.detail a').text())

      let id = transUrlId($tmp.attr('href').replace('.html', ''));
      list.push({
        id,
        name: escapeSpecChart(
          $lis.eq(i).find('dd').find('strong a').eq(0).text()
        ),
        cover: addHttp($tmp.find('img').attr('data-funlazy')),
      });
    }

    console.log(list);
    return {
      list,
      // total: jsmap.data.count * 10,
    };
  });
};

// 推荐列表
