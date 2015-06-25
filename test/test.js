import assert from 'assert';
import {parse, parseFilter, matchesFilter} from '../abp-filter-parser.js';
import fs from 'fs';

var testRules = new Map([
  ['/banner/*/img', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: '/banner/*/img',
    blocked: [
      'http://example.com/banner/foo/img',
      'http://example.com/banner/foo/bar/img?param',
      'http://example.com/banner//img/foo',
      'http://example.com/banner//img.gif',
    ],
    notBlocked: [
      'http://example.com/banner/',
      'http://example.com/banner/img',
      'http://example.com/img/banner/',
    ]
  }],
  ['/banner/*/img^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: '/banner/*/img^',
    blocked: [
      'http://example.com/banner/foo/img',
      'http://example.com/banner/foo/bar/img?param',
      'http://example.com/banner//img/foo',
    ],
    notBlocked: [
      'http://example.com/banner/img',
      'http://example.com/banner/foo/imgraph',
      'http://example.com/banner/foo/img.gif',
    ]
  }],
  ['||ads.example.com^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: true,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: 'ads.example.com^',
    blocked: [
      'http://ads.example.com/foo.gif',
      'http://server1.ads.example.com/foo.gif',
      'https://ads.example.com:8000/',
    ],
    notBlocked: [
      'http://ads.example.com.ua/foo.gif',
      'http://example.com/redirect/http://ads.example.com/',
    ],
  }],
  ['|http://example.com/|', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: true,
    rightAnchored: true,
    options: undefined,
    data: 'http://example.com/',
    blocked: [
      'http://example.com/'
    ],
    notBlocked: [
      'http://example.com/foo.gif',
      'http://example.info/redirect/http://example.com/',
    ],
  }],
  ['swf|', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: true,
    options: undefined,
    data: 'swf',
    blocked: [
      'http://example.com/annoyingflash.swf',
    ],
    notBlocked: [
      'http://example.com/swf/index.html'
    ],
  }],
  ['|http://baddomain.example/', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: true,
    rightAnchored: undefined,
    options: undefined,
    data: 'http://baddomain.example/',
    blocked: [
     'http://baddomain.example/banner.gif',
    ],
    notBlocked: [
      'http://gooddomain.example/analyze?http://baddomain.example',
    ],
  }],
  ["||example.com/banner.gif", {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: true,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: 'example.com/banner.gif',
    blocked: [
      'http://example.com/banner.gif',
      'https://example.com/banner.gif',
      'http://www.example.com/banner.gif',
    ],
    notBlocked: [
      'http://badexample.com/banner.gif',
      'http://gooddomain.example/analyze?http://example.com/banner.gif',
      'http://example.com.au/banner.gif',
      'http://example.com/banner2.gif',
    ],
  }],
  ['http://example.com^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: 'http://example.com^',
    blocked: [
      'http://example.com/',
      'http://example.com:8000/ ',
    ],
    notBlocked: [],
  }],
  ['^example.com^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: '^example.com^',
    blocked: [
      'http://example.com:8000/foo.bar?a=12&b=%D1%82%D0%B5%D1%81%D1%82',
    ],
    notBlocked: [],
  }],
  ['^%D1%82%D0%B5%D1%81%D1%82^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: '^%D1%82%D0%B5%D1%81%D1%82^',
    blocked: [
      'http://example.com:8000/foo.bar?a=12&b=%D1%82%D0%B5%D1%81%D1%82',
    ],
    notBlocked: [
      'http://example.com:8000/foo.bar?a=12&b%D1%82%D0%B5%D1%81%D1%823',
    ],
  }],
  ['^foo.bar^', {
    isRegex: false,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: '^foo.bar^',
    blocked: [
      'http://example.com:8000/foo.bar?a=12&b=%D1%82%D0%B5%D1%81%D1%82'
    ],
    notBlocked: [
    ],
  }],
  ['/banner\\d+/', {
    isRegex: true,
    isException: false,
    elementHiding: undefined,
    elementHidingException: undefined,
    hostAnchored: undefined,
    leftAnchored: undefined,
    rightAnchored: undefined,
    options: undefined,
    data: 'banner\\d+',
    blocked: [
      'banner123',
      'testbanner1',
    ],
    notBlocked: [
      'banners',
      'banners123',
    ],
  }],
]);

describe('#parseFilter()', function(){
  it('should extract proper parsing info for filter rules', function(){
    testRules.forEach((testRule, key) => {
      let parsedFilterData = {};
      parseFilter(key, parsedFilterData);
      for (let p in testRule) {
        if (!['blocked', 'notBlocked'].includes(p)) {
          assert.equal(testRule[p], parsedFilterData[p], `for property ${p}:
            ${testRule[p]} !== ${parsedFilterData[p]}`);
        }
      }
      for (let input of testRule.blocked) {
        assert(matchesFilter(parsedFilterData, input),
          `${key} should block ${input}`);
      }
      for (let input of testRule.notBlocked) {
        assert(!matchesFilter(parsedFilterData, input),
          `${key} should not block ${input}`);
      }
    });
  });
});

describe('#parse()', function(){
  it('should parse EasyList without failing', function(cb){
    fs.readFile('./test/data/easylist.txt', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      let parserData = parse(data);
      // Num lines minus (num empty lines + num comment lines)
      assert.equal(parserData.filterCount, 47536);
      cb();
    });
  });
});
