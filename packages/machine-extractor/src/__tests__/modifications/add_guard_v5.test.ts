import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) => {
  const modifiable = extractMachinesFromFile(outdent.string(code))!
    .machines[0]!;

  const original = modifiable.modify;
  modifiable.modify = function (edits) {
    return original.call(modifiable, edits, { v5: true });
  };

  return modifiable;
};

describe('add_guard v5', () => {
  it('should be possible to add a guard to a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: 'a'
        },
        states: {
          a: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: [],
          transitionPath: ['on', 'FOO', 0],
          name: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: {
            target: 'a',
            guard: "isItTooLate"
          }
        },
        states: {
          a: {}
        }
      }"
    `);
  });

  it('should be possible to add a guard to an object transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: {
            target: 'a'
          }
        },
        states: {
          a: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: [],
          transitionPath: ['on', 'FOO', 0],
          name: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: {
            target: 'a',
            guard: "isItTooLate"
          }
        },
        states: {
          a: {}
        }
      }"
    `);
  });

  it('should be possible to add a guard to the first transition for a given event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: ['a', 'b', 'c']
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: [],
          transitionPath: ['on', 'FOO', 0],
          name: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: [{
            target: 'a',
            guard: "isItTooLate"
          }, 'b', 'c']
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should be possible to add a guard to the last transition for a given event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: ['a', 'b', 'c']
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: [],
          transitionPath: ['on', 'FOO', 2],
          name: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: ['a', 'b', {
            target: 'c',
            guard: "isItTooLate"
          }]
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should be possible to add a guard to a middle transition for a given event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: ['a', 'b', 'c']
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: [],
          transitionPath: ['on', 'FOO', 1],
          name: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: ['a', {
            target: 'b',
            guard: "isItTooLate"
          }, 'c']
        },
        states: {
          a: {},
          b: {},
          c: {},
        }
      }"
    `);
  });

  it(`should be possible to add a guard to invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            invoke: {
              src: 'callDavid',
              onDone: 'b'
            }
          },
          b: {}
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: ['a'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          name: 'isHeBusy',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            invoke: {
              src: 'callDavid',
              onDone: {
                target: 'b',
                guard: "isHeBusy"
              }
            }
          },
          b: {}
        }
      }"
    `);
  });

  it('should be possible to add a guard to a transition defined for an empty event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              '': "b",
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_guard',
          path: ['a'],
          transitionPath: ['on', '', 0],
          name: 'isItHalfEmpty',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              '': {
                target: "b",
                guard: "isItHalfEmpty"
              },
            }
          },
          b: {},
        }
      }"
    `);
  });
});
