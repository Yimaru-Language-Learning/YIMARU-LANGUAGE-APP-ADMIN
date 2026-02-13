import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Edit, Trash2, HelpCircle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"

type QuestionType = "multiple-choice" | "short-answer" | "true-false"

interface Question {
  id: string
  question: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  points: number
  category?: string
  difficulty?: string
  createdAt?: string
}

// Mock data
const mockQuestions: Question[] = [
  {
    id: "1",
    question: "What is the capital of France?",
    type: "multiple-choice",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    points: 10,
    category: "Geography",
    difficulty: "Easy",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    question: "Explain the concept of React hooks in your own words.",
    type: "short-answer",
    options: [],
    correctAnswer: "React hooks are functions that let you use state and other React features in functional components.",
    points: 20,
    category: "Programming",
    difficulty: "Medium",
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    question: "JavaScript is a compiled language.",
    type: "true-false",
    options: ["True", "False"],
    correctAnswer: "False",
    points: 5,
    category: "Programming",
    difficulty: "Easy",
    createdAt: "2024-01-17",
  },
  {
    id: "4",
    question: "Which of the following is a CSS preprocessor?",
    type: "multiple-choice",
    options: ["SASS", "HTML", "JavaScript", "Python"],
    correctAnswer: "SASS",
    points: 15,
    category: "Web Development",
    difficulty: "Medium",
    createdAt: "2024-01-18",
  },
  {
    id: "5",
    question: "TypeScript is a superset of JavaScript.",
    type: "true-false",
    options: ["True", "False"],
    correctAnswer: "True",
    points: 10,
    category: "Programming",
    difficulty: "Easy",
    createdAt: "2024-01-19",
  },
]

const typeLabels: Record<QuestionType, string> = {
  "multiple-choice": "Multiple Choice",
  "short-answer": "Short Answer",
  "true-false": "True/False",
}

const typeColors: Record<QuestionType, string> = {
  "multiple-choice": "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  "short-answer": "bg-mint-100 text-green-700 ring-1 ring-inset ring-green-200",
  "true-false": "bg-brand-100 text-brand-600 ring-1 ring-inset ring-brand-200",
}

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || q.type === typeFilter
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter

    return matchesSearch && matchesType && matchesCategory && matchesDifficulty
  })

  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean)))
  const difficulties = Array.from(new Set(questions.map((q) => q.difficulty).filter(Boolean)))

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            Questions
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-grayScale-400">
            Create and manage your question bank
          </p>
        </div>
        <Link to="/content/questions/add" className="w-full sm:w-auto">
          <Button className="w-full bg-brand-500 hover:bg-brand-600 sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New Question
          </Button>
        </Link>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Question Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-300" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-colors focus:border-brand-300 focus:ring-brand-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
                <option value="true-false">True/False</option>
              </Select>

              {categories.length > 0 && (
                <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              )}

              {difficulties.length > 0 && (
                <Select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="all">All Difficulties</option>
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-xs font-medium text-grayScale-400">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>

          {/* Questions Table */}
          {filteredQuestions.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-grayScale-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-grayScale-100 hover:bg-grayScale-100">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Question
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Type
                    </TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">
                      Difficulty
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Points
                    </TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-grayScale-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question, index) => (
                    <TableRow
                      key={question.id}
                      className={`transition-colors hover:bg-brand-100/30 ${
                        index % 2 === 0 ? "bg-white" : "bg-grayScale-100/50"
                      }`}
                    >
                      <TableCell className="max-w-md py-3.5">
                        <div className="truncate text-sm font-medium text-grayScale-600">
                          {question.question}
                        </div>
                        {question.type === "multiple-choice" && question.options.length > 0 && (
                          <div className="mt-1 truncate text-xs text-grayScale-400">
                            Options: {question.options.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge className={`text-xs font-medium ${typeColors[question.type]}`}>
                          {typeLabels[question.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 md:table-cell">
                        {question.category || "—"}
                      </TableCell>
                      <TableCell className="hidden py-3.5 md:table-cell">
                        {question.difficulty && (
                          <Badge
                            variant={
                              question.difficulty === "Easy"
                                ? "default"
                                : question.difficulty === "Medium"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {question.difficulty}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-sm font-semibold text-grayScale-600">
                        {question.points}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/content/questions/edit/${question.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-grayScale-400 hover:bg-brand-100/50 hover:text-brand-500"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-grayScale-400 hover:bg-red-50 hover:text-destructive"
                            onClick={() => handleDelete(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-grayScale-200 py-20 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-grayScale-100 to-grayScale-200">
                <HelpCircle className="h-8 w-8 text-grayScale-400" />
              </div>
              <p className="text-base font-semibold text-grayScale-600">
                No questions found
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-grayScale-400">
                Try adjusting your search or filter criteria to find what you're
                looking for.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
