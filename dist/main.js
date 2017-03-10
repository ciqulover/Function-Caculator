(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// 常数
exports.default = {
  π: Math.PI,
  PI: Math.PI,
  e: Math.E
};

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = calculate;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// 核心计算函数，接收带计算的字符串和计算所需要的数据
// 数据包含正则，常量，内置函数和自定义函数四个部分
// 如果计算结果是数字，返回计算结果，否则返回错误提示

function calculate(text, data) {
  // 预处理
  text = preProcess(text);
  // 测试错误
  var error = checkError(text);
  if (error) return error;
  // 替换常量
  // text = reduceConst(text, constants)
  text = reduceConst(text, data.constants);
  // 计算表达式
  var regs = data.regs,
      preDefFunc = data.preDefFunc,
      userDefFunc = data.userDefFunc;

  try {
    text = reduceExp(text, { regs: regs, preDefFunc: preDefFunc, userDefFunc: userDefFunc });
  } catch (e) {
    return 'Error: ' + e.message + ', 请检查输入的表达式';
  }
  // 最后计算的表达式可能还会有'--'，为保证一定计算完毕，再次计算一次
  text = preProcess(text);
  text = reduceExp(text, { regs: regs, preDefFunc: preDefFunc, userDefFunc: userDefFunc });
  var num = Number(text);
  // 如果不是NaN，返回错误提示
  return num === num ? num : text;
}

function preProcess(text) {
  // 去除空白符
  text = text.replace(/\s/g, '');
  // 归并减号和加号
  text = text.replace(/--/g, '+');
  text = text.replace(/\+\++/g, '+');
  return text;
}

// 左右括号数量是否相同？
function checkError(text) {
  var textArray = [].concat(_toConsumableArray(text));
  var leftBracket = textArray.filter(function (i) {
    return i === '(';
  });
  var rightBracket = textArray.filter(function (i) {
    return i === ')';
  });
  var leftL = leftBracket.length;
  var rightL = rightBracket.length;
  if (leftL != rightL) return 'Error: \u7F3A\u5C11\u62EC\u53F7 ' + (leftL > rightL ? '")"' : '"("');
}

// 替换常量
// 有两种情况会调用，一次是初次计算时，替换所有预置常数
// 还有每一次解析函数表达式时会用调用时的参数替换函数参数

function reduceConst(text, constants) {
  var keys = Object.keys(constants);

  var constRegLeft = /(?:([-+*/\d])|\b)/.source;
  var constRegRight = /(?![A-Za-z\d])/.source;

  text = keys.reduce(function (pre, cur) {
    // 踏马哒 'π' 左边居然不算是'\b'，所以特殊处理
    // if (cur === 'π') return pre.replace(new RegExp('(?:\b|^)' + constRegRight, 'g'), Math.PI)
    var constReg = new RegExp(constRegLeft + cur + constRegRight, 'g');
    var val = constants[cur];
    if (cur === 'π') constReg = new RegExp('(\\d|^|[-+*\\/^%(])π' + constRegRight, 'g');
    pre = pre.replace(constReg, function (match, cap) {
      // 如果左边是数字，则添加一个乘号，如2x+y
      if (cap) cap = /\d/.test(cap) ? cap + '*' : cap;
      return cap ? cap + val : val;
    });
    return pre;
  }, text);
  return text;
}

// 为表达式计算每一级运算
function reduceExp(input, data) {
  return data.regs.reduce(function (pre, cur, index) {
    return calLevel(index, pre, data);
  }, input);
}

// 核心函数，计算当前运算级别
function calLevel(level, str, data) {
  // 如果已经出错了，直接返回
  if (/Error:/.test(str)) return str;
  var regs = data.regs,
      preDefFunc = data.preDefFunc,
      userDefFunc = data.userDefFunc;
  // 当前层级的正则

  var regsOfLevel = regs[level];
  var regNames = Object.keys(regsOfLevel);
  var i = regNames.length;

  var _loop = function _loop() {
    var regName = regNames[i];
    // 当前的正则匹配
    var matches = regsOfLevel[regName].exec(str);
    if (!matches) return 'continue';
    var result = void 0;
    // 括号中的内容或者第一个数值
    var argString = matches[1];
    var fnExp = matches[0];
    // num1和num2 可能不会用到
    var num1 = Number(matches[1]);
    var num2 = Number(matches[2]);
    // 括号有两种可能的含义，分别是函数调用和优先级改变，区别对待
    if (regName == 'bracket') {
      // 参数中有函数或者其他运算，则进一步解析参数
      if (/[-+*/()!^%]/.test(argString)) argString = reduceExp(argString, data);
      if (/Error:/.test(argString)) return {
          v: argString
        };
      if (argString === '') return {
          v: 'Error: \u51FD\u6570 <i>' + fnExp + '</i> \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A'
        };
      var argStringArray = argString.split(',');
      var args = [];
      var len = argStringArray.length;
      while (len--) {
        var arg = argStringArray[len];
        if (arg === '') return {
            v: 'Error: \u51FD\u6570 <i>' + fnExp + '</i> \u6709\u7A7A\u53C2\u6570'
          };
        var num = Number(arg);
        if (num !== num) return {
            v: 'Error: \u51FD\u6570 <i>' + fnExp + '</i> \u7684\u53C2\u6570 \'' + arg + '\' \u672A\u77E5'
          };
        args.unshift(num);
      }

      var fnName = matches.fn;
      // 匹配到了函数，如sin(10)在这里匹配, sin10则在下面匹配
      if (fnName) {
        var fn = preDefFunc[fnName];
        if (typeof fn == 'function') result = fn.apply(null, args);else if (fn = userDefFunc[fnName]) {
          var exp = preProcess(fn.exp);
          var fnArgs = preProcess(fn.args).split(',');
          // 用调用自定义函数时的参数值替换自定义函数参数
          var mapping = {};
          var reqL = fnArgs.length;
          var actL = args.length;
          if (reqL != actL) return {
              v: 'Error: \u51FD\u6570 <i>' + fnName + '(' + fnArgs + ')</i> \n                          \u9700\u8981 ' + reqL + ' \u4E2A\u53C2\u6570, \u5B9E\u9645\u4E0A\u6709 ' + actL + ' \u4E2A'
            };
          fnArgs.forEach(function (v, k) {
            return mapping[v] = args[k];
          });
          result = '(' + reduceConst(exp, mapping) + ')';
        } else return {
            v: 'Error: \u51FD\u6570 <i>' + fnName + '()</i> \u672A\u5B9A\u4E49'
          };
        // 如果不是函数调用，则只是改变优先级，继续搞他
      } else result = reduceExp(argString, data);
    }
    // 阶乘
    else if (regName == 'factorial') {
        var numStr = num1.toString();
        if (numStr.indexOf('.') > -1) return {
            v: 'Error: \u4E0D\u80FD\u5BF9\u975E\u6574\u6570 ' + numStr + ' \u9636\u4E58'
          };
        if (numStr.indexOf('-') > -1) return {
            v: 'Error: \u4E0D\u80FD\u5BF9\u8D1F\u6570 ' + numStr + ' \u9636\u4E58'
          };
        result = preDefFunc.fac(num1);
      }
      // 处理没有括号，只有一个参数的函数。如果有括号，在第一运算级中已计算
      // 这里的power，并不是函数power，而是'^'，所以不能省略，同'mod'
      else if (regName == 'power') result = preDefFunc.pow(num1, num2);else if (regName == 'absolute') result = preDefFunc.abs(num1);else if (regName == 'sine') result = preDefFunc.sin(num1);else if (regName == 'cosine') result = preDefFunc.cos(num1);else if (regName == 'cotangent') result = preDefFunc.cot(num1);else if (regName == 'tangent') result = preDefFunc.tan(num1);else if (regName == 'logarithm') result = preDefFunc.lg(num1);else if (regName == 'napLogarithm') result = preDefFunc.log(num1);else if (regName == 'multiply') result = num1 * num2;else if (regName == 'divide') result = num1 / num2;else if (regName == 'mod') result = num1 % num2;else if (regName == 'plus') result = num1 + num2;else if (regName == 'minus') result = num1 - num2;

    // 核心中的核心，匹配到的字符串被其计算的结果替换
    str = str.replace(matches[0], function (match, idx) {
      return matches.index == idx ? result : match;
    });

    //继续匹配当前层级的运算
    str = calLevel(level, str, data);
    return 'break';
  };

  _loop2: while (i--) {
    var _ret = _loop();

    switch (_ret) {
      case 'continue':
        continue;

      case 'break':
        break _loop2;

      default:
        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
  }

  return str;
}

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
// 内置函数

var abs = Math.abs,
    exp = Math.exp,
    log = Math.log,
    pow = Math.pow,
    sqrt = Math.sqrt,
    max = Math.max,
    min = Math.min;
var sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    asin = Math.asin,
    acos = Math.acos,
    atan = Math.atan;

var PI = Math.PI;

var fac = function fac(num) {
  if (num == 0) return 1;
  return num == 1 ? num : num * fac(num - 1);
};

var preDefFunc = {
  abs: abs, exp: exp, log: log, pow: pow, sqrt: sqrt, max: max, min: min, sin: sin, cos: cos, tan: tan, asin: asin, acos: acos, atan: atan, fac: fac,
  cot: function cot(num) {
    return 1 / cos(num);
  },
  lg: function lg(num) {
    return log(num) / log(10);
  },
  ln: log,
  angleToRed: function angleToRed(angle) {
    return angle / 180 * PI;
  },
  redToAngle: function redToAngle(red) {
    return red / PI * 180;
  },
  avg: function avg() {
    for (var _len = arguments.length, numbers = Array(_len), _key = 0; _key < _len; _key++) {
      numbers[_key] = arguments[_key];
    }

    return numbers.reduce(function (pre, cur) {
      return pre + cur;
    }) / numbers.length;
  }
};

exports.default = preDefFunc;

},{}],4:[function(require,module,exports){
'use strict';

var _regs = require('./regs');

var _regs2 = _interopRequireDefault(_regs);

var _core = require('./core');

var _core2 = _interopRequireDefault(_core);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

var _functions = require('./functions');

var _functions2 = _interopRequireDefault(_functions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } // 负责添加页面的交互和事件监听

var userDefFunc = {};

// 调用`calculate()`时的第二个参数 `data`
var data = { regs: _regs2.default, preDefFunc: _functions2.default, userDefFunc: userDefFunc, constants: _constants2.default };

var $ = document.getElementById.bind(document);

var input = $('input');
var resultEl = $('result');
var funcName = $('funcName');
var funcArgs = $('funcArgs');
var funcExp = $('funcExp');
var constName = $('constName');
var constValue = $('constValue');

var addConstPanel = document.querySelector('.addConst');
var addFuncPanel = document.querySelector('.addFunc');

// 劫持一下result.msg，如果赋的值中有 'Error' 则添加class启用动画钩子
var result = {};
function defineReactive(node, obj, val) {
  Object.defineProperty(obj, 'msg', {
    get: function get() {
      return val;
    },
    set: function set(newVal) {
      val = newVal;
      if (val.indexOf('Error:') > -1) node.classList.add('error');
      setTimeout(function () {
        node.classList.remove('error');
      }, 400);
      node.innerHTML = newVal;
    }
  });
}

defineReactive(resultEl, result, '');

$('doCalculate').addEventListener('click', function () {
  var text = input.value.trim();
  if (text === '') return result.msg = 'Error: 输入不能为空';
  var num = (0, _core2.default)(text, data);
  if (/Error:/.test(num)) return result.msg = num;
  if (typeof num == 'string') result.msg = 'Error: \u9047\u5230\u9519\u8BEF\uFF0C\u770B\u770B\u7ED3\u679C\u662F\u4E0D\u662F\u4F60\u60F3\u8981\u7684: ' + num;
  result.msg = num.toString();
});

$('addConst').addEventListener('click', function () {
  var name = constName.value.trim();
  var value = constValue.value.trim();
  var error = checkDuplicate(name);
  if (error) return result.msg = error;

  if (name === '') return result.msg = 'Error: 常量名不能为空';
  if (value === '') return result.msg = 'Error: 常量值不能为空';
  if (!/[A-Za-z]+/.test(name)) return result.msg = 'Error: 常量名只能包含英文字符';
  var num = Number(value);
  if (num !== num) return result.msg = 'Error: 常量值只能为数值';

  _constants2.default[name] = num;
  result.msg = '\u5DF2\u6DFB\u52A0\u81EA\u5B9A\u4E49\u5E38\u91CF <i>' + name + '</i> = ' + num;
  addConstPanel.classList.remove('show');
});

$('addFunc').addEventListener('click', function () {
  var name = funcName.value.trim();
  var args = funcArgs.value.trim();
  var exp = funcExp.value.trim();

  var error = checkDuplicate(name);
  if (error) return result.msg = error;

  if (name === '') return result.msg = 'Error: 函数名不能为空';
  if (args === '') return result.msg = 'Error: 参数不能为空';
  if (exp === '') return result.msg = 'Error: 表达式不能为空';
  if (!/[A-Za-z]+/.test(name)) return result.msg = 'Error: 函数名只能包含英文字符';
  if (/\d/.test(args)) return result.msg = 'Error: 函数名不能含数字';

  var argsArray = args.split(',');
  var len = argsArray.length;
  while (len--) {
    if (exp.indexOf(argsArray[len]) == -1) return result.msg = 'Error: 函数表达式与参数不匹配';
  }

  userDefFunc[name] = { exp: exp, args: args };
  result.msg = '\u5DF2\u6DFB\u52A0\u81EA\u5B9A\u4E49\u51FD\u6570 <i>' + name + '</i>(' + args + ') = ' + exp;
  addFuncPanel.classList.remove('show');
});

$('reqAddConst').addEventListener('click', function () {
  addConstPanel.classList.toggle('show');
  addFuncPanel.classList.remove('show');
});

$('reqAddFunc').addEventListener('click', function () {
  addFuncPanel.classList.toggle('show');
  addConstPanel.classList.remove('show');
});

document.body.addEventListener('focusin', function (e) {
  var target = e.target;
  if (target.nodeName.toLocaleLowerCase() == 'input') {
    resultEl.innerHTML = '';
  }
});

function checkDuplicate(name) {
  var existedFn = [].concat(_toConsumableArray(Object.keys(userDefFunc)), _toConsumableArray(Object.keys(_functions2.default)));
  var existedConst = Object.keys(_constants2.default);

  if (existedFn.indexOf(name) > -1) return 'Error: 同名方法已经存在';
  if (existedConst.indexOf(name) > -1) return 'Error: 同名常量已经存在';
}

},{"./constants":1,"./core":2,"./functions":3,"./regs":5}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var numReg = /(\d+(?:\.\d*)?)/.source;
var negNumReg = /(-?\d+(?:\.\d*)?)/.source;
var posNumReg = /(\+?\d+(?:\.\d*)?)/.source;
var bothNumReg = /([-+]?\d+(?:\.\d*)?)/.source;

exports.default = [{
  bracket: { exec: exec }
}, {
  factorial: new RegExp(negNumReg + '!')
}, {
  power: new RegExp(negNumReg + '\\^' + bothNumReg)
}, {
  mod: new RegExp(numReg + '%' + bothNumReg)
}, {
  absolute: new RegExp('abs' + negNumReg),
  sine: new RegExp('sin' + negNumReg),
  cosine: new RegExp('cos' + negNumReg),
  cotangent: new RegExp('cot' + negNumReg),
  tangent: new RegExp('tan' + negNumReg),
  logarithm: new RegExp('(?:lg|log)' + negNumReg),
  napLogarithm: new RegExp('ln' + negNumReg)
}, {
  multiply: new RegExp(numReg + '\\*' + bothNumReg),
  divide: new RegExp(numReg + '\/' + bothNumReg)
}, {
  plus: new RegExp(negNumReg + '\\+' + posNumReg),
  minus: new RegExp(negNumReg + '\\+?-' + posNumReg)
}];

// 因为Javascript正则中没有平衡组，所以借此函数匹配括号对，
// 括号前的字符决定是否是函数，捕获括号中的表达式

function exec(text) {
  var leftMatch = /([A-Za-z]*)\(/.exec(text);
  if (!leftMatch) return null;
  var leftMatchString = leftMatch[0];
  var length = leftMatchString.length;
  var left = leftMatch.index;
  var leftMatches = [];
  var right = void 0;
  var i = left + length;

  while (i < text.length) {
    if (text.charAt(i) == '(') {
      leftMatches.push(i);
    }
    if (text.charAt(i) == ')') {
      if (leftMatches.length) leftMatches.pop();else {
        right = i;
        break;
      }
    }
    i++;
  }
  text = text.slice(left + length, right);
  var match = leftMatchString + text + ')';
  var result = [match, text];
  result.fn = leftMatchString.slice(0, -1);
  result.index = left;
  return result;
}

},{}]},{},[4]);
