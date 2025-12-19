import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select } from "../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"

const mockLeaders = [
  { id: "1", name: "John Doe", role: "CEO" },
  { id: "2", name: "Jane Smith", role: "COO" },
]

const mockMembers = [
  { id: "1", name: "John Doe", role: "Member" },
  { id: "2", name: "Jane Smith", role: "Member" },
]

export function PracticeDetailsPage() {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [leaderName, setLeaderName] = useState("")
  const [leaderRole, setLeaderRole] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const handleAddMember = () => {
    console.log("Add member:", { memberName, memberRole })
    setIsMemberModalOpen(false)
    setMemberName("")
    setMemberRole("")
  }

  const handleAddLeader = () => {
    console.log("Add leader:", { leaderName, leaderRole })
    setIsLeaderModalOpen(false)
    setLeaderName("")
    setLeaderRole("")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-grayScale-900">Practice Management</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Practice Leadership */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-grayScale-900">Practice Leadership</h2>
            <Button
              size="sm"
              onClick={() => setIsLeaderModalOpen(true)}
              className="bg-brand-500 hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Add New Leader
            </Button>
          </div>
          <div className="space-y-3">
            {mockLeaders.map((leader) => (
              <div
                key={leader.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-grayScale-900">{leader.name}</p>
                  <p className="text-sm text-grayScale-600">{leader.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Practice Details */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-grayScale-900">Practice Details</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Practice Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter practice name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Practice Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter practice description"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Practice Type
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select practice type</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Practice Address
              </label>
              <div className="space-y-2">
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="Zip Code"
                />
              </div>
            </div>

            <Button className="w-full bg-brand-500 hover:bg-brand-600">Save Changes</Button>
          </div>
        </Card>
      </div>

      {/* Practice Members */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-grayScale-900">Practice Members</h2>
          <Button
            size="sm"
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-brand-500 hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add New Member
          </Button>
        </div>
        <div className="space-y-3">
          {mockMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-grayScale-900">{member.name}</p>
                <p className="text-sm text-grayScale-600">{member.role}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Member Name
              </label>
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter member name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Member Role
              </label>
              <Input
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                placeholder="Enter member role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="bg-brand-500 hover:bg-brand-600">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leader Modal */}
      <Dialog open={isLeaderModalOpen} onOpenChange={setIsLeaderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Leader</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Leader Name
              </label>
              <Input
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="Enter leader name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-grayScale-700">
                Leader Role
              </label>
              <Input
                value={leaderRole}
                onChange={(e) => setLeaderRole(e.target.value)}
                placeholder="Enter leader role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeader} className="bg-brand-500 hover:bg-brand-600">
              Add Leader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

