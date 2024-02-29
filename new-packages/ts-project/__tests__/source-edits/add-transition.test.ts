import { outdent } from 'outdent';
import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to add a targetless transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: null,
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	on: {
    		FOO: undefined
    	}
    });",
    }
  `);
});

test('should be possible to add a transition targeting the root from a nested state (implicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: "nested",
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
          id: "nested",
          on: {
            FOO: "#(machine)"
          },
        },
      },
    });",
    }
  `);
});

test('should be possible to add a transition targeting the root from a nested state (explicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
        initial: "foo",
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: "nested",
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      initial: "foo",
      states: {
        foo: {
          // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
          id: "nested",
          on: {
            FOO: "#groot"
          },
        },
      },
    });",
    }
  `);
});

test('should be possible to add a reentering self-transition to the root (implicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	on: {
    		FOO: {
    			target: "#(machine)",
    			reenter: true
    		}
    	}
    });",
    }
  `);
});

test('should be possible to add a reentering self-transition to the root (explicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      on: {
        FOO: {
          target: "#groot",
          reenter: true
        }
      },
    });",
    }
  `);
});

test('should be possible to add a non-reentering self-transition to the root (implicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	on: {
    		FOO: "#(machine)"
    	}
    });",
    }
  `);
});

test('should be possible to add a non-reentering self-transition to the root (explicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: [],
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      on: {
        FOO: "#groot"
      },
    });",
    }
  `);
});

test('should be possible to add an external self-transition to a state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['foo'],
      transitionPath: ['on', 'FOO', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            FOO: {
              target: "foo",
              reenter: true
            }
          }
        },
      },
    });",
    }
  `);
});

test('should be possible to add a non-reentering self-transition to a state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['foo'],
      transitionPath: ['on', 'FOO', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            FOO: "foo"
          }
        },
      },
    });",
    }
  `);
});

test('should be possible to add a transition to an existing `on` key', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: "bar",
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'OTHER', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: "bar",
            OTHER: "baz",
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar"],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar",
            "baz"],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (single line, one element, trailing comment after element)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar" /* comm */],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar", /* comm */
            "baz"],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (single line, one element, trailing comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar",],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar",
            "baz",],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (single line, one element, trailing comment after trailing comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar", /* comm */],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar", /* comm */
            "baz",],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (single line, one element, trailing comma after trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar" /* comm */,],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar" /* comm */,
            "baz",],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (one element, trailing comma with its own trailing comment after single-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [
                "bar" // what a weird situation
              , // weird indeed
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar" // what a weird situation
            , // weird indeed
              "baz",
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (one element, trailing comma and multi-line comment below it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [
                "bar",
                /* comment */
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz",
              /* comment */
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (one element and multi-line comment below it, without trailing comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [
                "bar"
                /* comment */
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz"
              /* comment */
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of the existing array (one element, with trailing comma after multi-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [
                "bar"
                /* comment */ ,
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar"
              /* comment */ ,
              "baz",
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the start of the existing array (single line, one element)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar"],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["baz",
            "bar"],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the start of the existing array (single line, one element, comment directly before it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [/* comment */ "bar"],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["baz",
            /* comment */ "bar"],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the start of the existing array (one element, comment directly before it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [
                /* comment */ "bar"
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "baz",
              /* comment */ "bar"
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the start of the existing array (one element, comment after opening square bracket)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: [ // comment
                "bar"
              ],
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [ // comment
              "baz",
              "bar"
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition in the middle of the existing array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: ["bar", "qwe"],
            },
          },
          bar: {},
          baz: {},
          qwe: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: ["bar", "baz",
            "qwe"],
          },
        },
        bar: {},
        baz: {},
        qwe: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (single line, comma directly after it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: "bar",
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz"
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (single line, comma directly after it, comment before it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT: /* comm */ "bar",
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              /* comm */ "bar",
              "baz"
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (existing value on subsequent line)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT:
                "bar",
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz"
            ],
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (existing value on subsequent line, trailing comma on yet another line)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT:
                "bar"

                ,
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz"
            ]

              ,
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (existing value on subsequent line, with trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT:
                "bar" // comment
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar", // comment
              "baz"
            ]
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (existing value on subsequent line, multi-line comment below it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT:
                "bar"
                /* comment */
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar",
              "baz"
            ]
              /* comment */
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test('should be possible to add a transition at the end of an upgraded array (existing value on subsequent line, with trailing comment and comma after it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              NEXT:
                "bar" /* comment */ ,
            },
          },
          bar: {},
          baz: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['baz'],
      transitionPath: ['on', 'NEXT', 1],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: [
              "bar", /* comment */
              "baz"
            ] ,
          },
        },
        bar: {},
        baz: {},
      },
    });",
    }
  `);
});

test.todo(
  'should be possible to add a transition at the start of an upgraded array',
  async () => {
    const tmpPath = await testdir({
      'tsconfig.json': JSON.stringify({}),
      'index.ts': ts`
        import { createMachine } from "xstate";

        createMachine({
          initial: "foo",
          states: {
            foo: {
              on: {
                NEXT: "bar",
              },
            },
            bar: {},
            baz: {},
          },
        });
      `,
    });

    const project = await createTestProject(tmpPath);

    const textEdits = project.editDigraph(
      {
        fileName: 'index.ts',
        machineIndex: 0,
      },
      {
        type: 'add_transition',
        sourcePath: ['foo'],
        targetPath: ['baz'],
        transitionPath: ['on', 'NEXT', 0],
      },
    );
    expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot();
  },
);

test("should be possible to add a transition to invoke's onDone", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: "someService",
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['invoke', 0, 'onDone', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          invoke: {
            src: "someService",
            onDone: "bar",
          },
        },
        bar: {},
      },
    });",
    }
  `);
});

test("should be possible to add a transition to invoke's onError", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: "someService",
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['invoke', 0, 'onError', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          invoke: {
            src: "someService",
            onError: "bar",
          },
        },
        bar: {},
      },
    });",
    }
  `);
});

test("should be possible to add a transition to the last invoke's onDone", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: [
              {
                src: "someService",
              },
              {
                src: "anotherService",
              },
            ],
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['invoke', 1, 'onDone', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          invoke: [
            {
              src: "someService",
            },
            {
              src: "anotherService",
              onDone: "bar",
            },
          ],
        },
        bar: {},
      },
    });",
    }
  `);
});

test("should be possible to add a transition to the first invoke's onDone", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: [
              {
                src: "someService",
              },
              {
                src: "anotherService",
              },
            ],
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['invoke', 0, 'onDone', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          invoke: [
            {
              src: "someService",
              onDone: "bar",
            },
            {
              src: "anotherService",
            },
          ],
        },
        bar: {},
      },
    });",
    }
  `);
});

test("should be possible to add a transition to a middle invoke's onDone", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: [
              {
                src: "someService",
              },
              {
                src: "veryUsefulService",
              },
              {
                src: "anotherService",
              },
            ],
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['invoke', 1, 'onDone', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          invoke: [
            {
              src: "someService",
            },
            {
              src: "veryUsefulService",
              onDone: "bar",
            },
            {
              src: "anotherService",
            },
          ],
        },
        bar: {},
      },
    });",
    }
  `);
});

test("should be possible to add a transition to state's onDone", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['onDone', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          onDone: "bar"
        },
        bar: {},
      },
    });",
    }
  `);
});

test('should be possible to add an always transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['always', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          always: "bar"
        },
        bar: {},
      },
    });",
    }
  `);
});

test('should use a relative child target when adding a transition to a child', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: ['bar'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {},
        bar: {},
      },
      on: {
        NEXT: ".bar"
      },
    });",
    }
  `);
});

test('should use a relative descendant target when adding a transition to a deep descendant from the root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {},
                },
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: ['bar', 'bar2', 'bar3'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {},
        bar: {
          states: {
            bar2: {
              states: {
                bar3: {},
              },
            },
          },
        },
      },
      on: {
        NEXT: ".bar.bar2.bar3"
      },
    });",
    }
  `);
});

test('should use a relative descendant target when adding a transition to a deep descendant from a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {},
                },
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['bar'],
      targetPath: ['bar', 'bar2', 'bar3'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {},
        bar: {
          states: {
            bar2: {
              states: {
                bar3: {},
              },
            },
          },
          on: {
            NEXT: ".bar2.bar3"
          },
        },
      },
    });",
    }
  `);
});

test('should use a sibling-like target when adding a transition to a deep descendant from a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            initial: "foo",
            states: {
              foo: {},
              bar: {
                states: {
                  bar2: {
                    states: {
                      bar3: {},
                    },
                  },
                },
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['a', 'foo'],
      targetPath: ['a', 'bar', 'bar2', 'bar3'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          initial: "foo",
          states: {
            foo: {
              on: {
                NEXT: "bar.bar2.bar3"
              }
            },
            bar: {
              states: {
                bar2: {
                  states: {
                    bar3: {},
                  },
                },
              },
            },
          },
        },
      },
    });",
    }
  `);
});

test('should use an ID-based target when adding a transition to a distant state (root implicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
            },
          },
          b: {
            initial: "foo",
            states: {
              foo: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['a', 'a1'],
      targetPath: ['b', 'foo'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          initial: "a1",
          states: {
            a1: {
              on: {
                NEXT: "#(machine).b.foo"
              }
            },
          },
        },
        b: {
          initial: "foo",
          states: {
            foo: {},
          },
        },
      },
    });",
    }
  `);
});

test('should use an ID-based target when adding a transition to a distant state (root explicit ID)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
        initial: "a",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
            },
          },
          b: {
            initial: "foo",
            states: {
              foo: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['a', 'a1'],
      targetPath: ['b', 'foo'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      initial: "a",
      states: {
        a: {
          initial: "a1",
          states: {
            a1: {
              on: {
                NEXT: "#groot.b.foo"
              }
            },
          },
        },
        b: {
          initial: "foo",
          states: {
            foo: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should use target's ID when available and when adding a transition to a distant state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
        initial: "a",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
            },
          },
          b: {
            initial: "foo",
            states: {
              foo: {
                id: "bullseye",
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['a', 'a1'],
      targetPath: ['b', 'foo'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      initial: "a",
      states: {
        a: {
          initial: "a1",
          states: {
            a1: {
              on: {
                NEXT: "#bullseye"
              }
            },
          },
        },
        b: {
          initial: "foo",
          states: {
            foo: {
              id: "bullseye",
            },
          },
        },
      },
    });",
    }
  `);
});

test(`should use the closest available ID from the target's ancestry path when adding a transition to a distant state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "groot",
        initial: "a",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
            },
          },
          b: {
            id: "bullseye",
            initial: "foo",
            states: {
              foo: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['a', 'a1'],
      targetPath: ['b', 'foo'],
      transitionPath: ['on', 'NEXT', 0],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "groot",
      initial: "a",
      states: {
        a: {
          initial: "a1",
          states: {
            a1: {
              on: {
                NEXT: "#bullseye.foo"
              }
            },
          },
        },
        b: {
          id: "bullseye",
          initial: "foo",
          states: {
            foo: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to add a reentering transition with a guard`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: ['bar'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: true,
      guard: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: {
              target: "bar",
              guard: "isItTooLate",
              reenter: true
            }
          }
        },
        bar: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a non-reentering transition with a guard`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: ['bar'],
      transitionPath: ['on', 'NEXT', 0],
      guard: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {},
        bar: {},
      },
      on: {
        NEXT: {
          target: ".bar",
          guard: "isItTooLate"
        }
      },
    });",
    }
  `);
});

test(`should be possible to add a reentering transition to a child with a guard`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: [],
      targetPath: ['bar'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: true,
      guard: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {},
        bar: {},
      },
      on: {
        NEXT: {
          target: ".bar",
          guard: "isItTooLate",
          reenter: true
        }
      },
    });",
    }
  `);
});

test(`should be possible to add a targetless transition with a guard`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'add_transition',
      sourcePath: ['foo'],
      targetPath: null,
      transitionPath: ['on', 'NEXT', 0],
      guard: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          on: {
            NEXT: {
              target: undefined,
              guard: "isItTooLate"
            }
          }
        },
      },
    });",
    }
  `);
});
