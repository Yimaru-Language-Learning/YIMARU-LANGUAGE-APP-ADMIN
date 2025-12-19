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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/content/courses")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-grayScale-900">Add New Video</h1>
        </div>
        <Button onClick={handleSubmit} className="bg-brand-500 hover:bg-brand-600">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Video Upload</h2>
          <FileUpload
            accept="video/*"
            onFileSelect={setVideoFile}
            label="Drag & Drop Video Here"
            description="or click to browse files"
            className="min-h-[200px]"
          />
        </Card>

        {videoFile && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Video Preview</h2>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-grayScale-900">
              <video
                src={URL.createObjectURL(videoFile)}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Video Details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">Tags</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, Hooks, JavaScript"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
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
                <label className="mb-2 block text-sm font-medium text-grayScale-700">
                  Thumbnail
                </label>
                <FileUpload
                  accept="image/*"
                  onFileSelect={(file) => setFormData({ ...formData, thumbnail: file })}
                  label="Upload Thumbnail"
                  description="or click to browse"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-brand-500 hover:bg-brand-600">
            Save Video
          </Button>
        </div>
      </form>
    </div>
  )
}

