import { createMachine } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./parametrized-guard-in-always-transition.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        MY_AWESOME_EVENT: 'b',
      },
    },
    b: {
      always: {
        target: 'c',
        guard: {
          type: 'myAwesomeGuard',
        },
      },
    },
    c: {},
  },
});