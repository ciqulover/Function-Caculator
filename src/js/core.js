// 核心计算函数，接收带计算的字符串和计算所需要的数据
// 数据包含正则，常量，内置函数和自定义函数四个部分
// 如果计算结果是数字，返回计算结果，否则返回错误提示

export default function calculate(text, data) {
  // 预处理
  text = preProcess(text)
  // 测试错误
  const error = checkError(text)
  if (error) return error
  // 替换常量
  // text = reduceConst(text, constants)
  text = reduceConst(text, data.constants)
  // 计算表达式
  const {regs, preDefFunc, userDefFunc} =data
  try {
    text = reduceExp(text, {regs, preDefFunc, userDefFunc})
  } catch (e) {
    return 'Error: ' + e.message + ', 请检查输入的表达式'
  }
  // 最后计算的表达式可能还会有'--'，为保证一定计算完毕，再次计算一次
  text = preProcess(text)
  text = reduceExp(text, {regs, preDefFunc, userDefFunc})
  const num = Number(text)
  // 如果不是NaN，返回错误提示
  return num === num ? num : text
}

function preProcess(text) {
  // 去除空白符
  text = text.replace(/\s/g, '')
  // 归并减号和加号
  text = text.replace(/--/g, '+')
  text = text.replace(/\+\++/g, '+')
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


// 替换常量
// 有两种情况会调用，一次是初次计算时，替换所有预置常数
// 还有每一次解析函数表达式时会用调用时的参数替换函数参数

function reduceConst(text, constants) {
  const keys = Object.keys(constants)

  const constRegLeft = /(?:([-+*/\d])|\b)/.source
  const constRegRight = /(?![A-Za-z\d])/.source

  text = keys.reduce(function (pre, cur) {
    // 踏马哒 'π' 左边居然不算是'\b'，所以特殊处理
    // if (cur === 'π') return pre.replace(new RegExp('(?:\b|^)' + constRegRight, 'g'), Math.PI)
    let constReg = new RegExp(constRegLeft + cur + constRegRight, 'g')
    const val = constants[cur]
    if (cur === 'π') constReg = new RegExp('(\\d|^|[-+*\\/^%(])π' + constRegRight, 'g')
    pre = pre.replace(constReg, (match, cap) => {
      // 如果左边是数字，则添加一个乘号，如2x+y
      if (cap) cap = /\d/.test(cap) ? cap + '*' : cap
      return cap ? cap + val : val
    })
    return pre
  }, text)
  return text
}

// 为表达式计算每一级运算
function reduceExp(input, data) {
  return data.regs.reduce(function (pre, cur, index) {
    return calLevel(index, pre, data)
  }, input)
}

// 核心函数，计算当前运算级别
function calLevel(level, str, data) {
  // 如果已经出错了，直接返回
  if (/Error:/.test(str)) return str
  const {regs, preDefFunc, userDefFunc} = data
  // 当前层级的正则
  const regsOfLevel = regs[level]
  const regNames = Object.keys(regsOfLevel)
  let i = regNames.length
  while (i--) {
    const regName = regNames[i]
    // 当前的正则匹配
    const matches = regsOfLevel[regName].exec(str)
    if (!matches) continue
    let result
    // 括号中的内容或者第一个数值
    let argString = matches[1]
    const fnExp = matches[0]
    // num1和num2 可能不会用到
    const num1 = Number(matches[1])
    const num2 = Number(matches[2])
    // 括号有两种可能的含义，分别是函数调用和优先级改变，区别对待
    if (regName == 'bracket') {
      // 参数中有函数或者其他运算，则进一步解析参数
      if (/[-+*/()!^%]/.test(argString)) argString = reduceExp(argString, data)
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
      // 匹配到了函数，如sin(10)在这里匹配, sin10则在下面匹配
      if (fnName) {
        let fn = preDefFunc[fnName]
        if (typeof fn == 'function') result = fn.apply(null, args)
        else if (fn = userDefFunc[fnName]) {
          const exp = preProcess(fn.exp)
          const fnArgs = preProcess(fn.args).split(',')
          // 用调用自定义函数时的参数值替换自定义函数参数
          const mapping = {}
          const reqL = fnArgs.length
          const actL = args.length
          if (reqL != actL) return `Error: 函数 <i>${fnName}(${fnArgs})</i> 
                          需要 ${reqL} 个参数, 实际上有 ${actL} 个`
          fnArgs.forEach((v, k) => mapping[v] = args[k])
          result = '(' + reduceConst(exp, mapping) + ')'
        } else return `Error: 函数 <i>${fnName}()</i> 未定义`
        // 如果不是函数调用，则只是改变优先级，继续搞他
      } else result = reduceExp(argString, data)
    }
    // 阶乘
    else if (regName == 'factorial') {
      const numStr = num1.toString()
      if (numStr.indexOf('.') > -1) return `Error: 不能对非整数 ${numStr} 阶乘`
      if (numStr.indexOf('-') > -1) return `Error: 不能对负数 ${numStr} 阶乘`
      result = preDefFunc.fac(num1)
    }
    // 处理没有括号，只有一个参数的函数。如果有括号，在第一运算级中已计算
    // 这里的power，并不是函数power，而是'^'，所以不能省略，同'mod'
    else if (regName == 'power') result = preDefFunc.pow(num1, num2)
    else if (regName == 'absolute') result = preDefFunc.abs(num1)
    else if (regName == 'sine') result = preDefFunc.sin(num1)
    else if (regName == 'cosine') result = preDefFunc.cos(num1)
    else if (regName == 'cotangent') result = preDefFunc.cot(num1)
    else if (regName == 'tangent') result = preDefFunc.tan(num1)
    else if (regName == 'logarithm') result = preDefFunc.lg(num1)
    else if (regName == 'napLogarithm') result = preDefFunc.log(num1)
    else if (regName == 'multiply') result = num1 * num2
    else if (regName == 'divide') result = num1 / num2
    else if (regName == 'mod') result = num1 % num2
    else if (regName == 'plus') result = num1 + num2
    else if (regName == 'minus') result = num1 - num2

    // 核心中的核心，匹配到的字符串被其计算的结果替换
    str = str.replace(
      matches[0],
      (match, idx) => matches.index == idx ? result : match
    )

    //继续匹配当前层级的运算
    str = calLevel(level, str, data)
    break
  }
  return str
}
