import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, X } from "lucide-react"
import { toast } from "sonner"
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
      toast.error("Missing question", {
        description: "Please enter a question before saving.",
      })
      return
    }

    if (formData.type === "multiple-choice" || formData.type === "true-false") {
      if (!formData.correctAnswer) {
        toast.error("Missing correct answer", {
          description: "Select the correct answer for this question.",
        })
        return
      }
      if (formData.type === "multiple-choice") {
        const hasEmptyOptions = formData.options.some((opt) => !opt.trim())
        if (hasEmptyOptions) {
          toast.error("Incomplete options", {
            description: "Fill in all answer options for this multiple choice question.",
          })
          return
        }
      }
    } else if (formData.type === "short-answer") {
      if (!formData.correctAnswer.trim()) {
        toast.error("Missing correct answer", {
          description: "Enter the expected correct answer.",
        })
        return
      }
    }

    // In a real app, save the question here
    console.log("Saving question:", formData)
    toast.success(isEditing ? "Question updated" : "Question created", {
      description: isEditing
        ? "The question has been updated successfully."
        : "Your new question has been created.",
    })
    navigate("/content/questions")
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/content/questions")}
          className="rounded-lg bg-grayScale-50 hover:bg-brand-500/10 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">
            {isEditing ? "Edit Question" : "Add New Question"}
          </h1>
          <p className="mt-1 text-sm text-grayScale-400">
            {isEditing ? "Update the question details below" : "Fill in the details to create a new question"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <Card className="shadow-sm border border-grayScale-100 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-grayScale-600">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-7">
              {/* Question Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
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

              <hr className="border-grayScale-100" />

              {/* Question Text */}
              <div>
                <label htmlFor="question" className="mb-1.5 block text-sm font-medium text-grayScale-500">
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
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                    Options
                  </label>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-grayScale-50 text-grayScale-400 text-xs font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
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
                            className="opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {formData.type === "multiple-choice" && (
                      <Button type="button" variant="outline" onClick={addOption} className="w-full mt-1 border-dashed border-grayScale-200 text-grayScale-400 hover:text-brand-500 hover:border-brand-500/30">
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <hr className="border-grayScale-100" />

              {/* Correct Answer */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
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

              <hr className="border-grayScale-100" />

              {/* Points and Difficulty side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Points */}
                <div>
                  <label htmlFor="points" className="mb-1.5 block text-sm font-medium text-grayScale-500">
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

                {/* Difficulty */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
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
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Category (Optional)
                </label>
                <Input
                  id="category"
                  placeholder="e.g., Programming, Geography"
                  value={formData.category || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-grayScale-100">
                <Button type="button" variant="outline" onClick={() => navigate("/content/questions")} className="w-full sm:w-auto hover:bg-grayScale-50">
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-white w-full sm:w-auto shadow-sm hover:shadow-md transition-all">
                  {isEditing ? "Update Question" : "Create Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
