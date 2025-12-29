import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"

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
}

// Mock data for editing
const mockQuestion: Question = {
  id: "1",
  question: "",
  type: "multiple-choice",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 10,
  category: "",
  difficulty: "",
}

export function AddQuestionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id

  const [formData, setFormData] = useState<Question>(
    isEditing
      ? mockQuestion // In a real app, fetch the question by id
      : {
          id: Date.now().toString(),
          question: "",
          type: "multiple-choice",
          options: ["", "", "", ""],
          correctAnswer: "",
          points: 10,
          category: "",
          difficulty: "",
        },
  )

  const handleTypeChange = (type: QuestionType) => {
    setFormData((prev) => {
      if (type === "true-false") {
        return {
          ...prev,
          type,
          options: ["True", "False"],
          correctAnswer: prev.correctAnswer === "True" || prev.correctAnswer === "False" ? prev.correctAnswer : "",
        }
      } else if (type === "short-answer") {
        return {
          ...prev,
          type,
          options: [],
          correctAnswer: "",
        }
      } else {
        return {
          ...prev,
          type,
          options: prev.options.length > 0 ? prev.options : ["", "", "", ""],
        }
      }
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options]
      newOptions[index] = value
      return { ...prev, options: newOptions }
    })
  }

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }))
  }

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.question.trim()) {
      alert("Please enter a question")
      return
    }

    if (formData.type === "multiple-choice" || formData.type === "true-false") {
      if (!formData.correctAnswer) {
        alert("Please select a correct answer")
        return
      }
      if (formData.type === "multiple-choice") {
        const hasEmptyOptions = formData.options.some((opt) => !opt.trim())
        if (hasEmptyOptions) {
          alert("Please fill in all options")
          return
        }
      }
    } else if (formData.type === "short-answer") {
      if (!formData.correctAnswer.trim()) {
        alert("Please enter a correct answer")
        return
      }
    }

    // In a real app, save the question here
    console.log("Saving question:", formData)
    alert(isEditing ? "Question updated successfully!" : "Question created successfully!")
    navigate("/content/questions")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/content/questions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-grayScale-900">
          {isEditing ? "Edit Question" : "Add New Question"}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Question Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-600">
                Question Type
              </label>
              <Select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
                <option value="true-false">True/False</option>
              </Select>
            </div>

            {/* Question Text */}
            <div>
              <label htmlFor="question" className="mb-2 block text-sm font-medium text-grayScale-600">
                Question
              </label>
              <Textarea
                id="question"
                placeholder="Enter your question here..."
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                rows={3}
                required
              />
            </div>

            {/* Options for Multiple Choice */}
            {(formData.type === "multiple-choice" || formData.type === "true-false") && (
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-600">
                  Options
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        disabled={formData.type === "true-false"}
                        required
                      />
                      {formData.type === "multiple-choice" && formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.type === "multiple-choice" && (
                    <Button type="button" variant="outline" onClick={addOption} className="w-full">
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Correct Answer */}
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-600">
                Correct Answer
              </label>
              {formData.type === "multiple-choice" || formData.type === "true-false" ? (
                <Select
                  value={formData.correctAnswer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))
                  }
                  required
                >
                  <option value="">Select correct answer</option>
                  {formData.options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : (
                <Textarea
                  placeholder="Enter the correct answer..."
                  value={formData.correctAnswer}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))
                  }
                  rows={2}
                  required
                />
              )}
            </div>

            {/* Points */}
            <div>
              <label htmlFor="points" className="mb-2 block text-sm font-medium text-grayScale-600">
                Points
              </label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, points: parseInt(e.target.value) || 0 }))
                }
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-grayScale-600">
                Category (Optional)
              </label>
              <Input
                id="category"
                placeholder="e.g., Programming, Geography"
                value={formData.category || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-600">
                Difficulty (Optional)
              </label>
              <Select
                value={formData.difficulty || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="">Select difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/content/questions")}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-500 hover:bg-brand-600">
                {isEditing ? "Update Question" : "Create Question"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

