import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
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
  "multiple-choice": "bg-blue-100 text-blue-700",
  "short-answer": "bg-green-100 text-green-700",
  "true-false": "bg-purple-100 text-purple-700",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-grayScale-900">Questions</h1>
        <Link to="/content/questions/add">
          <Button className="bg-brand-500 hover:bg-brand-600">
            <Plus className="h-4 w-4" />
            Add New Question
          </Button>
        </Link>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Question Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
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
          <div className="text-sm text-grayScale-500">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>

          {/* Questions Table */}
          {filteredQuestions.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md">
                        <div className="truncate font-medium">{question.question}</div>
                        {question.type === "multiple-choice" && question.options.length > 0 && (
                          <div className="mt-1 text-xs text-grayScale-400">
                            Options: {question.options.join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={typeColors[question.type]}>
                          {typeLabels[question.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{question.category || "-"}</TableCell>
                      <TableCell>
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
                      <TableCell>{question.points}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/content/questions/edit/${question.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-grayScale-400">
              <p>No questions found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

