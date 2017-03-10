const numReg = /(\d+(?:\.\d*)?)/.source
const negNumReg = /(-?\d+(?:\.\d*)?)/.source
const posNumReg = /(\+?\d+(?:\.\d*)?)/.source
const bothNumReg = /([-+]?\d+(?:\.\d*)?)/.source

export default [
  {
    bracket: {exec}
  },
  {
    factorial: new RegExp(negNumReg + '!')
  },
  {
    power: new RegExp(negNumReg + '\\^' + bothNumReg),
  },
  {
    mod: new RegExp(numReg + '%' + bothNumReg),
  },
  {
    absolute: new RegExp('abs' + negNumReg),
    sine: new RegExp('sin' + negNumReg),
    cosine: new RegExp('cos' + negNumReg),
    cotangent: new RegExp('cot' + negNumReg),
    tangent: new RegExp('tan' + negNumReg),
    logarithm: new RegExp('(?:lg|log)' + negNumReg),
    napLogarithm: new RegExp('ln' + negNumReg),
  },
  {
    multiply: new RegExp(numReg + '\\*' + bothNumReg),
    divide: new RegExp(numReg + '\/' + bothNumReg),
  },
  {
    plus: new RegExp(negNumReg + '\\+' + posNumReg),
    minus: new RegExp(negNumReg + '\\+?-' + posNumReg),
  }
]

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
  result.fn = leftMatchString.slice(0, -1)
  result.index = left
  return result
}
