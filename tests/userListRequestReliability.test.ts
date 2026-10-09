import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

// Exercise the page's actual effect and cleanup without adding a browser/test-renderer dependency.
const source = readFileSync("src/pages/user-management/UsersListPage.tsx", "utf8")
const ast = ts.createSourceFile("UsersListPage.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let effect: ts.ArrowFunction | undefined
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === "useEffect") {
    const callback = node.arguments[0]
    if (callback && ts.isArrowFunction(callback) && callback.getText(ast).includes("const fetchUsers")) {
      effect = callback
    }
  }
  ts.forEachChild(node, visit)
}
visit(ast)
assert.ok(effect, "could not find the user-list fetch effect")
const compiled = ts.transpileModule(`const fetchEffect = ${effect.getText(ast)}; fetchEffect`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText

type User = { id: number; gender: string; status: string }
type Result = { data: { data: { users: User[]; total: number } } }
function harness() {
  const pending: {
    params: Record<string, unknown>
    resolve: (value: Result) => void
    reject: (error: Error) => void
  }[] = []
  const state = {
    users: [{ id: 0, gender: "", status: "ACTIVE" }], total: 1, loading: false,
    statuses: {} as Record<number, boolean>, errors: [] as string[], writes: 0,
  }
  const dependencies = {
    page: 1, pageSize: 5, search: "", createdAfterLocal: "", createdBeforeLocal: "",
    countryFilter: "", regionFilter: "", subscriptionStatusFilter: "", ageGroupFilter: "", genderFilter: "",
    getUsers: (params: Record<string, unknown>) => new Promise<Result>((resolve, reject) => {
      pending.push({ params, resolve, reject })
    }),
    fromDatetimeLocalAppValue: () => undefined,
    mapUserApiToUser: (user: User) => user,
    setLoading: (loading: boolean) => { state.loading = loading; state.writes++ },
    setUsers: (users: User[]) => { state.users = users; state.writes++ },
    setTotal: (total: number) => { state.total = total; state.writes++ },
    setToggledStatuses: (update: (prev: Record<number, boolean>) => Record<number, boolean>) => {
      state.statuses = update(state.statuses)
      state.writes++
    },
    axios: { isAxiosError: () => false },
    toast: { error: (message: string) => { state.errors.push(message) } },
    console: { error: () => {} },
  }
  let cleanup: (() => void) | undefined
  function select(filters: Partial<typeof dependencies> = {}) {
    cleanup?.()
    const run = runInNewContext(compiled, { ...dependencies, ...filters }) as () => () => void
    cleanup = run()
  }
  return { state, pending, select, unmount: () => cleanup?.() }
}
const result = (id: number, gender: string, total = 1): Result => ({
  data: { data: { users: [{ id, gender, status: "ACTIVE" }], total } },
})
// Allow both the await continuation and its finally block to finish.
const settle = async () => { await Promise.resolve(); await Promise.resolve() }

test("a slower previous filter response cannot overwrite the current results", async () => {
  const h = harness()
  h.select({ genderFilter: "male" })
  h.select({ genderFilter: "female", ageGroupFilter: "18_24" })
  assert.equal(h.pending[1].params.gender, "female")
  assert.equal(h.pending[1].params.age_group, "18_24")
  h.pending[1].resolve(result(2, "female", 12))
  await settle()
  const writes = h.state.writes
  h.pending[0].resolve(result(1, "male", 99))
  await settle()
  assert.equal(h.state.users[0].gender, "female")
  assert.equal(h.state.total, 12)
  assert.equal(h.state.statuses[2], true)
  assert.equal(h.state.statuses[1], undefined)
  assert.equal(h.state.writes, writes)
})

test("a stale failure cannot clear results or show an error", async () => {
  const h = harness()
  h.select({ ageGroupFilter: "18_24" })
  h.select({ ageGroupFilter: "25_34" })
  h.pending[1].resolve(result(2, "female"))
  await settle()
  const writes = h.state.writes
  h.pending[0].reject(new Error("old request failed"))
  await settle()
  assert.equal(h.state.users[0].id, 2)
  assert.equal(h.state.errors.length, 0)
  assert.equal(h.state.writes, writes)
})

for (const failed of [false, true]) {
  test(`stale ${failed ? "failure" : "success"} cannot stop the latest request's loading state`, async () => {
    const h = harness()
    h.select({ page: 1 })
    h.select({ page: 2 })
    if (failed) h.pending[0].reject(new Error("old request failed"))
    else h.pending[0].resolve(result(1, "male"))
    await settle()
    assert.equal(h.state.loading, true)
    assert.equal(h.state.users[0].id, 0)
    assert.equal(h.state.errors.length, 0)
    h.pending[1].resolve(result(2, "female"))
    await settle()
    assert.equal(h.state.loading, false)
    assert.equal(h.state.users[0].id, 2)
  })
}

for (const failed of [false, true]) {
  test(`a ${failed ? "failure" : "success"} after unmount causes no state updates or errors`, async () => {
    const h = harness()
    h.select()
    h.unmount()
    const writes = h.state.writes
    if (failed) h.pending[0].reject(new Error("request failed after unmount"))
    else h.pending[0].resolve(result(1, "male"))
    await settle()
    assert.equal(h.state.writes, writes)
    assert.equal(h.state.errors.length, 0)
  })
}

test("the current request still handles failures and ends loading", async () => {
  const h = harness()
  h.select()
  h.pending[0].reject(new Error("current request failed"))
  await settle()
  assert.equal(h.state.users.length, 0)
  assert.equal(h.state.total, 0)
  assert.equal(h.state.loading, false)
  assert.deepEqual(h.state.errors, ["Failed to fetch users"])
})
