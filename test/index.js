import regs from '../src/js/./regs'
import ca from '../src/js/core'
import preDefFunc from '../src/js/./functions'
import constants from '../src/js/./constants'
const userDefFunc = {}
const data = {regs, preDefFunc, userDefFunc, constants}
const calculate = text => ca(text, data)
import chai from 'chai'
chai.should()

const {abs, log, pow, max, min} = Math
const {sin, cos, tan} = Math
const {E, PI} = Math
const avg = (...num) => num.reduce((pre, cur) => pre + cur) / num.length

describe('fundamental', () => {
  it('add', () => {
    calculate('1+2').should.equal(3)
  })
  it('minus', () => {
    calculate('10-2').should.equal(8)
  })
  it('multiply', () => {
    calculate('2*3').should.equal(6)
  })
  it('divide', () => {
    calculate('4/3').should.equal(4 / 3)
  })
  it('power', () => {
    calculate('2^3').should.equal(8)
    calculate('1-(-2)^3').should.equal(9)
  })
  it('mod', () => {
    calculate('2%3').should.equal(2)
  })
  it('factorial', () => {
    calculate('3!').should.equal(6)
  })
})

describe('constant', () => {
  it('e', () => {
    calculate('e').should.equal(E)
  })
  it('π', () => {
    calculate('π').should.equal(PI)
  })
  it('constant calculate', () => {
    calculate('e+1').should.equal(E + 1)
  })
  it('multiple constant', () => {
    calculate('e*π*e-e/π').should.equal(E * PI * E - E / PI)
    calculate('e^π').should.equal(pow(E, PI))
    calculate('π^e^π').should.equal(pow(pow(PI, E), PI))
  })
})

describe('function', () => {
  it('abs', () => {
    calculate('abs(-1)').should.equal(1)
    calculate('abs-10.2').should.equal(10.2)
  })
  it('avg', () => {
    calculate('avg(1,2,3)').should.equal(2)
  })
  it('max', () => {
    calculate('max(1.3,2,3.3)').should.equal(3.3)
  })
  it('min', () => {
    calculate('min(1.3,2,3.3)').should.equal(1.3)
  })
  it('sin', () => {
    calculate('sin(10)').should.equal(sin(10))
    calculate('sin10').should.equal(sin(10))
  })
  it('cos', () => {
    calculate('cos(10)').should.equal(cos(10))
    calculate('cos10').should.equal(cos(10))
  })
  it('tan', () => {
    calculate('tan(20)').should.equal(tan(20))
    calculate('tan20').should.equal(tan(20))
  })
  it('cot', () => {
    calculate('cot(20)').should.equal(1 / cos(20))
    calculate('cot20').should.equal(1 / cos(20))
  })
  it('lg', () => {
    calculate('lg(100)').should.equal(2)
    calculate('lg100').should.equal(2)
  })
  it('ln', () => {
    calculate('ln(100)').should.equal(log(100))
    calculate('log(100)').should.equal(log(100))
    calculate('ln100').should.equal(log(100))
  })
  it('ln & pow', () => {
    calculate('ln(e*e) + pow(2,3)').should.equal(log(E * E) + pow(2, 3))
    calculate('ln(pow(e,4))').should.equal(4)
  })
  it('nesting', () => {
    calculate('pow(pow(2,3),3)').should.equal(pow(pow(2, 3), 3))
  })
})


describe('奇葩测试', () => {
  it('一堆加减号', () => {
    calculate('-2++-3-+4--5').should.equal(-4)
  })
  it('多级阶乘', () => {
    calculate('3!!').should.equal(720)
  })
  it('之前少了个 "%" 情况，诶', () => {
    calculate('(2 % 3) ^ 3').should.equal(8)
  })
  it('乱七八糟的计算1', () => {
    calculate('-(-2/2.77+sin10)^3!*4.3-avg(2%3+1,1,0.4-2)')
      .should.equal(-pow((-2 / 2.77 + sin(10)), 6) * 4.3 - avg(3, 1, 0.4 - 2))
  })
  it('乱七八糟的计算2', () => {
    calculate('4!*((2-abs-3)-(π^(e/2-1)))')
      .should.equal(24 * (-1 - pow(PI, (E / 2 - 1))))
  })
  it('乱七八糟的计算3', () => {
    calculate('ln(ln(ln(e^e^e)))')
      .should.equal(log(log(log(pow(pow(E, E), E)))))
  })
})

// 懒得写了，借用龚宇阳同学的测试案例...
describe('边界情况测试', () => {
  it('连续幂运算', () => {
    calculate('2^3^4').should.equal(pow(pow(2, 3), 4))
  })
  it('嵌套幂运算', () => {
    calculate('(2+1)^(3-1)^4').should.equal(pow(pow((2 + 1), (3 - 1)), 4))
  })
})

describe('复杂情况', () => {
  it('复合幂运算', () => {
    calculate('1 + 3 + 2^(3^2)').should.equal(516)
    calculate('1 + 3 + sin(5 *(8 + 1))').should.equal(1 + 3 + sin(5 * (8 + 1)))
  })
})

describe('复合测试', () => {
  it('加减乘除余综合运算', () => {
    calculate('1+2*3-4/4').should.equal(6)
    calculate('5*4-3+6*3%2').should.equal(5 * 4 - 3 + 6 * (3 % 2))
    calculate('9.2*3%3-3*5*3-3-9+5/3').should.equal(9.2 * (3 % 3) - 3 * 5 * 3 - 3 - 9 + 5 / 3)
    calculate('6*5/32*3-1*3+2*4%3').should.equal(6 * 5 / 32 * 3 - 3 + 2 * (4 % 3))
    calculate('2.32*2.12/32.33+1').should.equal(+(2.32 * 2.12 / 32.33 + 1))
  })

  it('加减乘除余幂综合运算', () => {
    calculate('1^2+2*3-4/4').should.equal(6)
    calculate('5*4-3+6*3%2^2').should.equal(5 * 4 - 3 + 6 * (3 % pow(2, 2)))
    calculate('9.2*3%3-3*5*3^2-3-9+5/3').should.equal(9.2 * (3 % 3) - 3 * 5 * pow(3, 2) - 3 - 9 + 5 / 3)
    calculate('6*5/32*3-1^3*3+2*4%3').should.equal(6 * 5 / 32 * 3 - 3 + 2 * (4 % 3))
    calculate('2.32^4*2.12/32.33+1').should.equal(+(pow(2.32, 4) * 2.12 / 32.33 + 1))
  })
})

userDefFunc.f = {
  exp: '2x+y',
  args: 'x,y'
}

describe('自定义函数', () => {
  it('f', () => {
    calculate('f(2,2)').should.equal(6)
  })
  it('嵌套', () => {
    calculate('f(2,f(f(3,2),1))').should.equal(21)
  })
})

constants.c = 4

describe('自定义常量', () => {
  it('f', () => {
    calculate('c*c').should.equal(16)
  })
  it('嵌套', () => {
    calculate('f(c,f(f(c,2),1))').should.equal(29)
  })
})


describe('错误提示', () => {
  it('缺少括号', () => {
    calculate('min(2,max(2,3)').should.have.string('Error')
  })
  it('参数为空', () => {
    calculate('max()').should.have.string('Error')
  })
  it('参数有空字符串', () => {
    calculate('max(2,,3)').should.have.string('Error')
  })
  it('有未知参数', () => {
    calculate('max(2,a)').should.have.string('Error')
  })
  it('参数数量不匹配', () => {
    calculate('f(2)').should.have.string('Error')
  })
  it('函数为定义', () => {
    calculate('g(2)').should.have.string('Error')
  })
  it('不能对非整数阶乘', () => {
    calculate('2.7!').should.have.string('Error')
  })
  it('不能对负数阶乘', () => {
    calculate('-2!').should.have.string('Error')
  })
})

