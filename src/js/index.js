import calculate, {userDefFunc, preDefFunc, constants} from './calculator'

const $ = document.getElementById.bind(document)

const doCalculate = $('doCalculate')
const input = $('input')
const resultEl = $('result')
const funcName = $('funcName')
const funcArgs = $('funcArgs')
const funcExp = $('funcExp')
const constName = $('constName')
const constValue = $('constValue')

const addConstPanel = document.querySelector('.addConst')
const addFuncPanel = document.querySelector('.addFunc')


export const result = {}
function defineReactive(node, obj, val) {
  Object.defineProperty(obj, 'msg', {
    get: () => val,
    set: (newVal) => {
      val = newVal
      if (val.indexOf('Error:') > -1) node.classList.add('error')
      setTimeout(function () {
        node.classList.remove('error')
      }, 400)
      node.innerHTML = newVal
    }
  })
}

defineReactive(resultEl, result, '')

doCalculate.addEventListener('click', function () {
  const text = input.value.trim()
  if (text === '') return result.msg = 'Error: 输入不能为空'
  const numStr = calculate(text)
  if (/Error:/.test(numStr)) return result.msg = numStr
  const num = Number(numStr)
  if (num !== num) return result.msg = `Error: 遇到错误，看看结果是不是你想要的: ${numStr}`
  result.msg = num.toString()
})

$('addConst').addEventListener('click', function () {
  const name = constName.value.trim()
  const value = constValue.value.trim()
  const error = checkDuplicate(name)
  if (error) return result.msg = error

  if (name === '') return result.msg = 'Error: 常量名不能为空'
  if (value === '') return result.msg = 'Error: 常量值不能为空'
  if (!/[A-Za-z]+/.test(name)) return result.msg = 'Error: 常量名只能包含英文字符'
  const num = Number(value)
  if (num !== num) return result.msg = 'Error: 常量值只能为数值'

  constants[name] = num
  result.msg = `已添加自定义常量 <i>${name}</i> = ${num}`
  addConstPanel.classList.remove('show')
})


$('addFunc').addEventListener('click', function () {
  const name = funcName.value.trim()
  const args = funcArgs.value.trim()
  const exp = funcExp.value.trim()

  const error = checkDuplicate(name)
  if (error) return result.msg = error

  if (name === '') return result.msg = 'Error: 函数名不能为空'
  if (args === '') return result.msg = 'Error: 参数不能为空'
  if (exp === '') return result.msg = 'Error: 表达式不能为空'
  if (!/[A-Za-z]+/.test(name)) return result.msg = 'Error: 函数名只能包含英文字符'
  if (/\d/.test(args)) return result.msg = 'Error: 函数名不能含数字'

  const argsArray = args.split(',')
  let len = argsArray.length
  while (len--) {
    if (exp.indexOf(argsArray[len]) == -1) return result.msg = 'Error: 函数表达式与参数不匹配'
  }

  userDefFunc[name] = {exp, args}
  result.msg = `已添加自定义函数 <i>${name}</i>(${args}) = ${exp}`
  addFuncPanel.classList.remove('show')
})

$('reqAddConst').addEventListener('click', function () {
  addConstPanel.classList.toggle('show')
  addFuncPanel.classList.remove('show')
})

$('reqAddFunc').addEventListener('click', function () {
  addFuncPanel.classList.toggle('show')
  addConstPanel.classList.remove('show')
})

document.body.addEventListener('focusin', function (e) {
  const target = e.target
  if (target.nodeName.toLocaleLowerCase() == 'input') {
    resultEl.innerHTML = ''
  }
})


function checkDuplicate(name) {
  const existedFn = [...Object.keys(userDefFunc), ...Object.keys(preDefFunc)]
  const existedConst = Object.keys(constants)

  if (existedFn.indexOf(name) > -1) return 'Error: 同名方法已经存在'
  if (existedConst.indexOf(name) > -1) return 'Error: 同名常量已经存在'
}
