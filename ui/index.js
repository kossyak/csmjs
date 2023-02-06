import csm from '../csm'
import component from './ui'

const story = {
  name: 'door',
  description: '',
  context: ['start', 'lock', 'dark', 'close'],
  actions: {
    welcome: {
      permit: 'start',
      notify: ['hello world!', 'check!!']
    },
    light: {
      pop: 'dark',
      text: 'Включить свет',
    },
    dark: {
      pop: 'light',
      text: 'Выключить свет'
    },
    lock: {
      pop: 'unlock',
      permit: 'close',
      push: 'trigger',
      text: 'Запереть дверь'
    },
    unlock: {
      delete: 'start',
      pop: 'lock',
      text: 'Отпереть дверь',
    },
    close: {
      pop: 'open',
      text: 'Закрыть дверь'
    },
    open: {
      pop: 'close',
      permit: 'unlock',
      text: 'Открыть дверь',
    },
    enter: {
      permit: 'open',
      tabu: ['key', 'trigger'],
      text: 'Войти в комнату',
      actions: {
        back: {
          to: '/',
          text: 'Выйти из комнаты'
        },
        table: {
          permit: 'light',
          text: 'Осмотреть стол',
          actions: {
            key: {
              to: '/enter',
              tabu: 'key',
              delete: 'trigger',
              text: 'Взять ключ'
            },
            empty: {
              permit: 'key',
              to: '/enter',
              text: 'пусто'
            }
          }
        }
      }
    },
    exit: {
      permit: ['open', 'trigger', 'key'],
      text: 'Выйти',
      actions: {
        end: {
          text: 'Конец игры'
        }
      }
    }
  }
}
const root = document.querySelector('#root')
const leste = new Leste({ root })

csm.on('_create', async (entry) => {
  await leste.mount(component, {
    params: { name: entry.name },
    methods: {
      action: (action) => csm.action(action)
  }})
})
csm.on('_destroy', () => leste.unmount())
csm.on('_change', (arg) => root.method.change(arg))

csm.create(story)