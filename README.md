#Context State Machine

Example:
```js
const toggle = {
  name: 'toggle',
  description: '',
  context: ['off'],
  state: {
    on: {
      pop: 'off'
      // other params
    },
    off: {
      pop: 'on'
      // other params
    }
  }
}
```

```js
import Csm from './csm.js'

const root = document.querySelector('#root')
const csm = new Csm(root)
csm.create(project)
```
## Параметры состояния
### permit
Активирует состояние, только если все элементы присутствуют в контексте.

### pop
Активирует состояние, только если все элементы присутствуют в контексте, и сразу удаляет их из контекста.

### tabu
Запрещает активацию состояния, если хотя бы один элемент из списка есть в контексте.

### push
Добавляет соответствующие элементы в контест.

### delete
Удаляет соответствующие элементы из контекста.

### set
Устанавливает новый контекст.

### text
Текстовое описание состояния.



> 🎓 Параметры каждого состояния, могут содержать один или несколько элементов. Если элементов несколько, то они должны передаваться в виде массива.

> 🎓 При активации, каждое состояние добавляется контекст, только если его там не было ранее.
