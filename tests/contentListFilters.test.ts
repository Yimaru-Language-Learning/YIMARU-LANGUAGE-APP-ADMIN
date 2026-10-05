import assert from "node:assert/strict"
import test from "node:test"
import {
  filterBySearchAndPublishStatus,
  textMatchesSearch,
} from "../src/lib/contentListFilters"
import {
  normalizeSearchText,
  segmentWhitespaceInsensitiveSearch,
} from "../src/lib/searchText"

const course = "Duolingo English Test course"

for (const query of [
  "duolingo", "duolingoenglishtest", "duolingo english test", "english", "test",
  "  DUOLINGO   ENGLISH TEST  ", "duo lingo", "duolingo\tenglish\ntest",
]) {
  test(`matches ${JSON.stringify(query)} against the course title`, () => {
    assert.equal(textMatchesSearch(query, course), true)
  })
}

test("normalizes whitespace and casing on both sides", () => {
  assert.equal(normalizeSearchText(" Duolingo\tEnglish\u00a0Test\n"), "duolingoenglishtest")
  assert.equal(textMatchesSearch("duolingoenglishtest", "  DUOLINGO\tEnglish\u00a0Test "), true)
  assert.equal(textMatchesSearch("duolingo english test", "DuolingoEnglishTest"), true)
})

test("empty or whitespace-only queries restore all results", () => {
  assert.equal(textMatchesSearch("", course), true)
  assert.equal(textMatchesSearch(" \t\n\u00a0", null, undefined), true)
})

test("unrelated searches do not match", () => {
  assert.equal(textMatchesSearch("ielts", course), false)
  assert.equal(textMatchesSearch("english exam", course), false)
  assert.equal(textMatchesSearch("test", null, undefined), false)
})

test("matches descriptions as well as names without joining unrelated fields", () => {
  assert.equal(textMatchesSearch("englishpractice", "Course", "English practice"), true)
  assert.equal(textMatchesSearch("duolingoenglishtest", "Duolingo", "English Test"), false)
})

test("publish status filtering is unchanged", () => {
  const items = [
    { name: course, status: "PUBLISHED" },
    { name: course, status: "DRAFT" },
    { name: "IELTS course", status: "PUBLISHED" },
  ]
  const filtered = filterBySearchAndPublishStatus(items, {
    search: "duolingoenglishtest",
    publishStatusFilter: "PUBLISHED",
    getSearchFields: (item) => [item.name],
    getPublishStatus: (item) => item.status,
  })
  assert.deepEqual(filtered, [items[0]])
})

test("compact search highlights the original spaced title", () => {
  assert.deepEqual(segmentWhitespaceInsensitiveSearch(course, "duolingoenglishtest"), [
    { text: "Duolingo English Test", match: true },
    { text: " course", match: false },
  ])
})

test("highlights a whole-field match and preserves original text", () => {
  assert.deepEqual(segmentWhitespaceInsensitiveSearch("Duolingo English Test", "duolingo english test"), [
    { text: "Duolingo English Test", match: true },
  ])
  const text = "English\tTest and ENGLISH Test"
  const segments = segmentWhitespaceInsensitiveSearch(text, "englishtest")
  assert.equal(segments.filter((part) => part.match).length, 2)
  assert.equal(segments.map((part) => part.text).join(""), text)
})

test("highlighting preserves punctuation literally and safely", () => {
  assert.equal(textMatchesSearch("C++", "C++ course"), true)
  assert.equal(textMatchesSearch("C++", "C course"), false)
  assert.deepEqual(segmentWhitespaceInsensitiveSearch("C++ course", "C++"), [
    { text: "C++", match: true }, { text: " course", match: false },
  ])
  assert.deepEqual(segmentWhitespaceInsensitiveSearch("abc", "["), [
    { text: "abc", match: false },
  ])
})

test("empty and unmatched queries do not highlight text", () => {
  for (const query of ["", " \t\n", "ielts"]) {
    assert.deepEqual(segmentWhitespaceInsensitiveSearch(course, query), [
      { text: course, match: false },
    ])
  }
})
