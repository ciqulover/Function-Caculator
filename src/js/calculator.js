// 函数名
const bracket = Symbol('()')
const absolute = Symbol('abs')
const sine = Symbol('sin')
const cosine = Symbol('cos')
const cotangent = Symbol('cot')
const tangent = Symbol('tan')
const logarithm = Symbol('lg')
const napLogarithm = Symbol('ln')
const power = Symbol('^')
const multiply = Symbol('*')
const divide = Symbol('/')
const plus = Symbol('+')
const minus = Symbol('-')
const mod = Symbol('mod')
const factorial = Symbol('!')

const {abs, exp, log, pow, sqrt, max, min} = Math
const {sin, cos, tan, asin, acos, atan} = Math

// 常量
export const constants = {
  π: Math.PI,
  PI: Math.PI,
  e: Math.E,
}

const fac = num => num == 1 ? num : num * fac(num - 1)

// 内置函数
export const preDefFunc = {
  abs, exp, log, pow, sqrt, max, min, sin, cos, tan, asin, acos, atan, fac,
  cot: num => 1 / cos(num),
  lg: num => log(num) / log(10),
  ln: log,
  angleToRed: angle => angle / 180 * constants.PI,
  redToAngle: red => red / constants.PI * 180,
  avg: (...numbers) => numbers.reduce((pre, cur) => pre + cur) / numbers.length,
}

// 自定义函数
export const userDefFunc = {}

const numReg = /(\d+(?:\.\d*)?)/.source
const negNumReg = /(-?\d+(?:\.\d*)?)/.source
const posNumReg = /(\+?\d+(?:\.\d*)?)/.source
const bothNumReg = /([-+]?\d+(?:\.\d*)?)/.source

const regs = [
  {
    [bracket]: {exec}
  },
  {
    [factorial]: new RegExp(negNumReg + '!\\B')
  },
  {
    [power]: new RegExp(numReg + '\\^' + bothNumReg),
  },
  {
    [mod]: new RegExp(numReg + '%' + bothNumReg),
  },
  {
    [absolute]: new RegExp('abs' + negNumReg),
    [sine]: new RegExp('sin' + negNumReg),
    [cosine]: new RegExp('cos' + negNumReg),
    [cotangent]: new RegExp('cot' + negNumReg),
    [tangent]: new RegExp('tan' + negNumReg),
    [logarithm]: new RegExp('(?:lg|log)' + negNumReg),
    [napLogarithm]: new RegExp('ln' + negNumReg),
  },
  {
    [multiply]: new RegExp(numReg + '\\*' + bothNumReg),
    [divide]: new RegExp(numReg + '\/' + bothNumReg),
  },
  {
    [plus]: new RegExp(negNumReg + '\\+' + posNumReg),
    [minus]: new RegExp(negNumReg + '\\+?-' + posNumReg),
  }
]

// 入口函数
export default function calculate(text) {
  // 预处理
  text = preProcess(text)
  // 测试错误
  const error = checkError(text)
  if (error) return error
  // 替换常量
  text = reduceConst(text, constants)
  // 计算表达式
  try {
    text = reduceExp(text)
  } catch (e) {
    return 'Error: ' + e.message + ', 请检查输入的表达式'
  }
  return text
}

// 左右括号数量是否相同？
function checkError(text) {
  const textArray = [...text]
  const leftBracket = textArray.filter(i => i === '(')
  const rightBracket = textArray.filter(i => i === ')')
  const leftL = leftBracket.length
  const rightL = rightBracket.length
  if (leftL != rightL) return `Error: 缺少括号 ${leftL > rightL ? '")"' : '"("'}`
}

function preProcess(text) {
  // 去除空白符
  text = text.replace(/\s/g, '')
  // 归并减号和加号
  text = text.replace(/--/g, '+')
  text = text.replace(/\+\++/g, '+')
  return text
}

// 替换常量
function reduceConst(text, constants) {
  const keys = Object.keys(constants)

  const constRegLeft = /(?:([-+*/\d])|\b)/.source
  const constRegRight = /(?![A-z\d])/.source

  text = keys.reduce(function (pre, cur) {
    const constReg = new RegExp(constRegLeft + cur + constRegRight, 'g')
    const val = constants[cur]
    pre = pre.replace(constReg, (match, cap) => {
      if (cap) cap = /\d/.test(cap) ? cap + '*' : cap
      return cap ? cap + val : val
    })
    return pre
  }, text)
  return text
}

// 为表达式计算每一级运算
function reduceExp(input) {
  return regs.reduce(function (pre, cur, index) {
    return calLevel(index, pre)
  }, input)
}

// 核心函数，计算当前运算级别
function calLevel(level, str) {

  if (/Error:/.test(str)) return str
  str = preProcess(str)
  const regsOfLevel = regs[level]
  const symbols = Object.getOwnPropertySymbols(regsOfLevel)
  let i = symbols.length
  while (i--) {
    const symbol = symbols[i]
    // 当前的正则匹配
    const matches = regsOfLevel[symbol].exec(str)
    if (!matches) continue
    let result
    // 括号中的内容或者第一个数值
    let argString = matches[1]
    const fnExp = matches[0]
    const num1 = Number(matches[1])
    const num2 = Number(matches[2])
    // 括号有两种可能的含义，分别是函数调用和优先级改变，区别对待
    if (symbol == bracket) {
      // 参数中有函数或者其他运算
      if (/[-+*/()!^]/.test(argString)) argString = reduceExp(argString)
      if (/Error:/.test(argString)) return argString
      if (argString === '') return `Error: 函数 <i>${fnExp}</i> 参数不能为空`
      const argStringArray = argString.split(',')
      let args = []
      let len = argStringArray.length
      while (len--) {
        const arg = argStringArray[len]
        if (arg === '') return `Error: 函数 <i>${fnExp}</i> 有空参数`
        const num = Number(arg)
        if (num !== num) return `Error: 函数 <i>${fnExp}</i> 的参数 '${arg}' 未知`
        args.unshift(num)
      }

      const fnName = matches.fn
      // 匹配到了函数，如sin(x)在这里匹配
      if (fnName) {
        let fn = preDefFunc[fnName]
        if (typeof fn == 'function') result = fn.apply(null, args)
        else if (fn = userDefFunc[fnName]) {
          const exp = preProcess(fn.exp)
          const fnArgs = preProcess(fn.args).split(',')
          const mapping = {}
          const reqL = fnArgs.length
          const actL = args.length
          if (reqL != actL) return `Error: 函数 <i>${fnName}(${fnArgs})</i> 
                          需要 ${reqL} 个参数, 实际上有 ${actL} 个`
          fnArgs.forEach((v, k) => mapping[v] = args[k])
          result = '(' + reduceConst(exp, mapping) + ')'
        } else return `Error: 函数 <i>${fnName}()</i> 未定义`
      } else result = reduceExp(argString)
    }
    // 阶乘
    else if (symbol == factorial) {
      const numStr = num1.toString()
      if (numStr.indexOf('.') > -1) return `不能对非整数 ${numStr} 阶乘`
      if (numStr.indexOf('-') > -1) return `不能对负数 ${numStr} 阶乘`
      result = fac(num1)
    }
    // 处理没有括号，只有一个参数的函数。如果有括号，在第一运算级中已计算
    else if (symbol == power) result = pow(num1, num2)
    else if (symbol == absolute) result = abs(num1)
    else if (symbol == sine) result = sin(num1)
    else if (symbol == cosine) result = cos(num1)
    else if (symbol == cotangent) result = preDefFunc.cot(num1)
    else if (symbol == tangent) result = tan(num1)
    else if (symbol == logarithm) result = preDefFunc.lg(num1)
    else if (symbol == napLogarithm) result = log(num1)
    else if (symbol == multiply) result = num1 * num2
    else if (symbol == divide) result = num1 / num2
    else if (symbol == mod) result = num1 % num2
    else if (symbol == plus) result = num1 + num2
    else if (symbol == minus) result = num1 - num2

    // 核心中的核心，匹配到的字符串被其计算的结果替换
    str = str.replace(
      matches[0],
      (match, idx) => matches.index == idx ? result : match
    )

    //继续匹配当前层级的运算
    str = calLevel(level, str)
    break
  }
  return str
}

// 因为Javascript正则中没有平衡组，所以借此函数匹配括号对，
// 括号前的字符决定是否是函数，捕获括号中的表达式
function exec(text) {
  const leftMatch = /([A-Za-z]*)\(/.exec(text)
  if (!leftMatch) return null
  const leftMatchString = leftMatch[0]
  const length = leftMatchString.length
  const left = leftMatch.index
  const leftMatches = []
  let right
  let i = left + length

  while (i < text.length) {
    if (text.charAt(i) == '(') {
      leftMatches.push(i)
    }
    if (text.charAt(i) == ')') {
      if (leftMatches.length) leftMatches.pop()
      else {
        right = i
        break
      }
    }
    i++
  }
  text = text.slice(left + length, right)
  const match = leftMatchString + text + ')'
  const result = [match, text]
  result.fn = leftMatchString.slice(0, length - 1)
  result.index = left
  return result
}
