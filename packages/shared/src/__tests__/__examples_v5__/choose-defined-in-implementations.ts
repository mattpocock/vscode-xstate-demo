import { choose, createMachine } from 'xstate';

createMachine(
  {
    tsTypes:
      {} as import('./choose-defined-in-implementations.typegen').Typegen0,
    initial: 'a',
    states: {
      a: {
        on: {
          FOO: 'b',
        },
      },
      b: {
        entry: 'wow',
      },
    },
  },
  {
    guards: {
      cond1: () => true,
    },
    actions: {
      a: () => {},
      b: () => {},
      c: () => {},
      wow: choose([
        {
          actions: ['a', 'b', 'c'],
          guard: 'cond1',
        },
      ]),
    },
  },
);
