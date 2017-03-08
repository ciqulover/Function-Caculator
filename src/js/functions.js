// 内置函数

const {abs, exp, log, pow, sqrt, max, min} = Math
const {sin, cos, tan, asin, acos, atan} = Math
const PI = Math.PI

const fac = num => {
  if (num == 0) return 1
  return num == 1 ? num : num * fac(num - 1)
}

const preDefFunc = {
  abs, exp, log, pow, sqrt, max, min, sin, cos, tan, asin, acos, atan, fac,
  cot: num => 1 / cos(num),
  lg: num => log(num) / log(10),
  ln: log,
  angleToRed: angle => angle / 180 * PI,
  redToAngle: red => red / PI * 180,
  avg: (...numbers) => numbers.reduce((pre, cur) => pre + cur) / numbers.length,
}

export default preDefFunc
