## Testing

- We do not mock database calls when we can provide a real database in isolation, especially in workflows and adapters
- Tests that involve a real db call end in *.integration.test.ts
- We use an explicit and pragmatic "system under test" pattern with arrange, act & assert comments
- The specific function that is to be acted and tested on is defined as `const sut = applyWorkflowFunction(...dependencies)`
- Generally `const sut = ...` should be the last line of the arrange block
- We execute only one thing in the act block, generally `sut(someParameters)`
- We do not abstract away test setups as that makes them harder to reason about and introduces coupling between tests
- We use storybook with vitest play functions to test ui behavior
- We only test behavior, never internals

## Error handling

- We use Errors as Values and avoid throwing Exceptions wherever possible (especially inside the domain)
- Function that can throw are to be wrapped in `R.fn` or `R.try`
- Function that can fail within the domain domain don't throw, but return R.Result<T, E>
- Results are unwrapped at the runtime boundary, meaning the place where a result would be returned to the outside world (i.e. a render block in svelte or an electron API), we handle Results accordingly (i.e. by returning a Error Svelte component on error or throwing inside a virtual thread)
- Errors in the Result are differentiated between expected domain errors (i.e. FileTooBigError) or a system error (i.e. DatabaseError)
- We make this difference because the user expects to see a helpful error message for domain errors, but system error details have to stay internal
- Custom errors are created with the @praha/error-factory library

## Domain Package (Functional DDD)

### Domain Types

- Domain types are always defined as a valibot schema and always follow the **AdjectiveNoun** rule, i.e. `PinnedThread` or `RunningTask`.
- A root domain type (i.e. `Thread` or `Task`) is an abstract idea that only informs the directory structure, no code operates on them. No schema defines them, they do not exist in code.
- Code always operates on a concrete context for a root domain type, i.e. a `PinnedThread` or a `ArchivedThead`. These types might share some properties, but they will drift and this is to be expected in a fluid domain with lots of contexts.
- These types and custom domain errors live under domain.ts of the root type, i.e. `packges/domain/src/thread/domain.ts`

### Workflows

- Use cases and workflows are interchangeable words. They represent a coherent orchestration of sub steps to execute a domain process
- Workflows generally have this pattern: **verb-noun-workflow.ts**, i.e. create-thread-workflow.ts
- Workflows live under the root domain type, i.e. `packages/domain/src/thread/create-thread-workflow.ts`

### Adapters

- An adapter acts as a guarding function to connect the pure domain with the outside world (i.e. databases, storages, external apis, agents, sdks, etc.)
- Adapters take domain types as inputs and return domain types, because adapters are called from the domain.
- Adapters can also take explicit arguments, like `id: UserId` or `password: string`
- The mapping from a type from the outside world (i.e. a drizzle return type) to a domain type always happens via a Schema with `R.parse()`
- Adapters live under the adapter folder of the root domain type, i.e. `packages/domain/src/thread/adapter/get-all-active-threads-adapter.ts`

### Pipelines

- We use pipeline oriented flows in the domain where it makes sense
- Pipelines can greatly reduce the mental overhead when reading complex flows, since they focus on the happy path while treating the error path with rigor
- There are cases where pipelines decrease the readability. We use an imperative style in these cases
- Choosing the right path is a matter of taste, there are no hard rules. As a rule of thumb start with the pipeline and switch to imperative if the pipelining gets in the way or complicates the flow without any benefit

### Misc

- We use undefined in the pure domain and map to and from the outside world accordingly (i.e. undefined can become null in a database layer)
- This mapping generally happens in adapter or mapping functions
- Pure functions that operate on concrete domain types live under the appropriate root domain type, i.e `packages/domain/src/thread/fn/pin-thread.ts`

### DI

- We use dependency injection in this project to satisfy inversion of control
- DI happens through partial application, using the `hasDependency` function
- Functions that require dependencies are defined in `packages/domain`
- Function that depend on other dependent functions declare the applied version as a dependency themselves.
- Side Effects are generally defined by using `hasDependency` and declaring the function that perform that side effect as a dependency

## Package Dependencies

- We use pnpm as the package manager
- We use vite plus as our task runner, orchestrator, linter and formatter
- We use TypeScript 7 wherever possible
- Shared packages are defined in the catalog of pnpm-workspace.yml

## Code Dependencies

- We don't use implicit dependencies when a function produces a side effect, always use `hasDependencies` to declare dependencies for a function
- An effectful function is a function that does **not** produce the exact same output when given the same input, is async or returns void/undefined/null.
- A pure function on the other hand is a function that **does** produce the exact same output when given the same input

## Svelte Components

- Components retrieve owned data, such as the current session, close to where it is used instead of receiving derived values from parents; genuine component inputs remain props.

## General

- We don't write comments in the code
