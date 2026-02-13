import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Save, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { FileUpload } from "../../components/ui/file-upload"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"

export function AddVideoPage() {
  const navigate = useNavigate()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    category: "",
    visibility: "",
    thumbnail: null as File | null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Video data:", { videoFile, ...formData })
    // Handle form submission
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/content/courses")}
            className="h-9 w-9 rounded-lg border border-grayScale-200 bg-white shadow-sm transition-colors hover:bg-grayScale-50 hover:border-grayScale-300"
          >
            <ArrowLeft className="h-4 w-4 text-grayScale-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Add New Video</h1>
            <p className="text-sm text-grayScale-400">Upload and configure a new video</p>
          </div>
        </div>
        <Button onClick={handleSubmit} className="bg-brand-500 shadow-sm hover:bg-brand-600 transition-colors">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {/* Upload Card */}
        <Card className="border-grayScale-200 p-6 shadow-sm sm:p-8">
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-grayScale-600">
            Video Upload
          </h2>
          <FileUpload
            accept="video/*"
            onFileSelect={setVideoFile}
            label="Drag & Drop Video Here"
            description="or click to browse files"
            className="min-h-[200px] rounded-xl border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
          />
        </Card>

        {/* Preview Card */}
        {videoFile && (
          <Card className="border-grayScale-200 overflow-hidden p-0 shadow-sm">
            <div className="border-b border-grayScale-100 px-6 py-4 sm:px-8">
              <h2 className="text-lg font-semibold tracking-tight text-grayScale-600">
                Video Preview
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-grayScale-900 shadow-inner">
                <video
                  src={URL.createObjectURL(videoFile)}
                  controls
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Details Card */}
        <Card className="border-grayScale-200 p-6 shadow-sm sm:p-8">
          <h2 className="mb-5 text-lg font-semibold tracking-tight text-grayScale-600">
            Video Details
          </h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Video Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter video title"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter video description"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, Hooks, JavaScript"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="language">Language</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Visibility
                </label>
                <Select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  required
                >
                  <option value="">Select visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-500">
                  Thumbnail
                </label>
                <FileUpload
                  accept="image/*"
                  onFileSelect={(file) => setFormData({ ...formData, thumbnail: file })}
                  label="Upload Thumbnail"
                  description="or click to browse"
                  className="min-h-[100px] rounded-lg border-2 border-dashed border-grayScale-300 transition-colors hover:border-brand-400 hover:bg-brand-50/30"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pb-4">
          <Button type="submit" className="bg-brand-500 px-6 shadow-sm hover:bg-brand-600 transition-colors">
            Save Video
          </Button>
        </div>
      </form>
    </div>
  )
}
