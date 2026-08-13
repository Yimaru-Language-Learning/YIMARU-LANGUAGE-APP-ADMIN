import { getApiErrorMessage } from "../../lib/apiErrors"
import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import {
  Plus,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  X,
  Trash2,
  Edit,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Eye,
} from "lucide-react"
import practiceSrc from "../../assets/Practice.svg"
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg"
import alertSrc from "../../assets/Alert.svg"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import {
  getSubCategoriesByCategoryId,
  getCourseCategories,
  createSubCategory,
  deleteCourseSubCategory,
  updateSubCategory,
} from "../../api/courses.api"
import type { CategorySubCategoryListItem, CourseCategory } from "../../types/course.types"
import { cn } from "../../lib/utils"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { DisplayValue } from "../../lib/displayValue"
import { SearchHighlight } from "../../components/SearchHighlight"

export function CoursesPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const [subCategories, setSubCategories] = useState<CategorySubCategoryListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState<CourseCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [displayOrder, setDisplayOrder] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<CategorySubCategoryListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [subCategoryToEdit, setSubCategoryToEdit] = useState<CategorySubCategoryListItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDisplayOrder, setEditDisplayOrder] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchSubCategories = async () => {
    if (!categoryId) return

    try {
      const res = await getSubCategoriesByCategoryId(Number(categoryId))
      const raw = res.data?.data?.sub_categories
      setSubCategories(Array.isArray(raw) ? raw : [])
    } catch (err) {
      console.error("Failed to fetch sub-categories:", err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return

      try {
        const [subRes, categoriesRes] = await Promise.all([
          getSubCategoriesByCategoryId(Number(categoryId)),
          getCourseCategories(),
        ])

        const raw = subRes.data?.data?.sub_categories
        setSubCategories(Array.isArray(raw) ? raw : [])
        const foundCategory = categoriesRes.data?.data?.categories?.find(
          (c) => c.id === Number(categoryId),
        )
        setCategory(foundCategory ?? null)
      } catch (err) {
        console.error("Failed to fetch sub-categories:", err)
        setError("Failed to load sub-categories")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categoryId])

  useEffect(() => {
    setPage(1)
  }, [categoryId, searchQuery])

  const handleOpenModal = () => {
    setTitle("")
    setDescription("")
    setDisplayOrder("")
    setSaveError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setTitle("")
    setDescription("")
    setDisplayOrder("")
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("Name is required")
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const orderParsed = parseInt(displayOrder.trim(), 10)
      await createSubCategory({
        category_id: Number(categoryId),
        name: title.trim(),
        description: description.trim() || null,
        ...(Number.isFinite(orderParsed) && orderParsed >= 0 ? { display_order: orderParsed } : {}),
      })
      handleCloseModal()
      await fetchSubCategories()
    } catch (err: any) {
      console.error("Failed to create course:", err)
      setSaveError(getApiErrorMessage(err, "Failed to create sub-category"))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (sub: CategorySubCategoryListItem) => {
    setSubCategoryToDelete(sub)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!subCategoryToDelete) return

    setDeleting(true)
    try {
      await deleteCourseSubCategory(subCategoryToDelete.id)
      setShowDeleteModal(false)
      setSubCategoryToDelete(null)
      await fetchSubCategories()
    } catch (err) {
      console.error("Failed to delete course:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (sub: CategorySubCategoryListItem) => {
    setTogglingId(sub.id)
    try {
      await updateSubCategory(sub.id, { is_active: !sub.is_active })
      await fetchSubCategories()
    } catch (err) {
      console.error("Failed to update course status:", err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditClick = (sub: CategorySubCategoryListItem) => {
    setSubCategoryToEdit(sub)
    setEditTitle(sub.name || "")
    setEditDescription(sub.description ?? "")
    setEditDisplayOrder(sub.display_order ?? 0)
    setUpdateError(null)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSubCategoryToEdit(null)
    setEditTitle("")
    setEditDescription("")
    setEditDisplayOrder(0)
    setUpdateError(null)
  }

  const handleUpdate = async () => {
    if (!subCategoryToEdit) return

    if (!editTitle.trim()) {
      setUpdateError("Name is required")
      return
    }

    setUpdating(true)
    setUpdateError(null)

    try {
      await updateSubCategory(subCategoryToEdit.id, {
        name: editTitle.trim(),
        description: editDescription.trim() || null,
        display_order: Math.max(0, Number(editDisplayOrder) || 0),
        is_active: subCategoryToEdit.is_active,
      })

      handleCloseEditModal()
      await fetchSubCategories()
    } catch (err: any) {
      console.error("Failed to update course:", err)
      setUpdateError(getApiErrorMessage(err, "Failed to update sub-category"))
    } finally {
      setUpdating(false)
    }
  }

  const handleOpenSubCategory = (subCategoryId: number) => {
    navigate(`/content/category/${categoryId}/sub-categories/${subCategoryId}/courses`)
  }

  const filteredSubCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return subCategories
    return subCategories.filter((sub) => {
      const haystack =
        `${sub.name} ${sub.description ?? ""} ${sub.category_name} ${sub.id} ${sub.display_order}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [subCategories, searchQuery])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <img src={spinnerSrc} alt="" className="h-10 w-10 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="mx-4 flex w-full max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 shadow-sm">
          <img src={alertSrc} alt="" className="h-10 w-10 shrink-0" />
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const totalCount = filteredSubCategories.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedSubCategories = filteredSubCategories.slice((safePage - 1) * pageSize, safePage * pageSize)
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, totalCount)

  const formatId = (id: number) => `#${id}`

  const formatCreatedAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return iso
    }
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1, 2, 3)
      if (safePage > 4) pages.push("...")
      if (safePage > 3 && safePage < totalPages - 2) pages.push(safePage)
      if (safePage < totalPages - 3) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-grayScale-100 bg-white px-5 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to="/content"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-grayScale-50 text-grayScale-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-grayScale-700 sm:text-2xl">
                {category?.name} Sub-categories
              </h1>
              <p className="mt-0.5 text-sm text-grayScale-400">
                <span className="font-medium text-grayScale-500">{subCategories.length}</span> sub-categories available
              </p>
            </div>
          </div>
          <Button className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto" onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Sub-category
          </Button>
        </div>
      </div>

      {/* Sub-category table — layout aligned with Activity Log (UserLogPage) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <h2 className="text-base font-semibold text-grayScale-600">Sub-category Management</h2>
        <div className="relative w-full min-w-[200px] flex-1 sm:max-w-xs sm:flex-initial">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sub-categories..."
            className="pl-9"
          />
        </div>
      </div>

      {subCategories.length === 0 ? (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <img src={practiceSrc} alt="" className="h-16 w-16" />
            <h3 className="mt-4 text-base font-semibold text-grayScale-600">No sub-categories yet</h3>
            <p className="mt-1.5 text-sm text-grayScale-400">No sub-categories found in this category.</p>
            <Button
              variant="outline"
              className="mt-5 border-brand-200 text-brand-600 transition-colors hover:bg-brand-50"
              onClick={handleOpenModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first sub-category
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[88px] whitespace-nowrap">ID</TableHead>
                <TableHead className="min-w-[160px]">SUB-CATEGORY</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[140px]">CATEGORY</TableHead>
                <TableHead className="min-w-[220px]">DESCRIPTION</TableHead>
                <TableHead className="hidden xl:table-cell w-[100px] whitespace-nowrap">ORDER</TableHead>
                <TableHead className="hidden md:table-cell whitespace-nowrap">CATEGORY ID</TableHead>
                <TableHead className="hidden xl:table-cell min-w-[140px] whitespace-nowrap">CREATED</TableHead>
                <TableHead className="whitespace-nowrap">STATUS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-8 w-8 text-grayScale-200" />
                      <div>
                        <p className="text-sm font-medium text-grayScale-500">No matching sub-categories</p>
                        <p className="mt-1 text-xs text-grayScale-400">Try a different search term.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSubCategories.map((sub) => (
                  <TableRow
                    key={sub.id}
                    className="group cursor-pointer"
                    onClick={() => handleOpenSubCategory(sub.id)}
                  >
                    <TableCell className="tabular-nums text-sm text-grayScale-500">{formatId(sub.id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <p className="min-w-0 text-sm font-medium text-grayScale-600">
                          <SearchHighlight text={sub.name} query={searchQuery} />
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-grayScale-600">
                        <SearchHighlight text={sub.category_name} query={searchQuery} />
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-md truncate text-sm text-grayScale-600" title={sub.description || undefined}>
                        <DisplayValue value={sub.description} query={searchQuery} />
                      </p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell tabular-nums text-sm text-grayScale-600">
                      {sub.display_order}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm tabular-nums text-grayScale-600">{formatId(sub.category_id)}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-grayScale-500">
                      {formatCreatedAt(sub.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={sub.is_active ? "success" : "secondary"}
                        className="text-[11px] font-semibold"
                      >
                        {sub.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenSubCategory(sub.id)
                          }}
                          title="View courses"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(sub)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-700"
                          disabled={togglingId === sub.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(sub)
                          }}
                        >
                          {sub.is_active ? (
                            <ToggleLeft className="h-4 w-4" />
                          ) : (
                            <ToggleRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(sub)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>Showing</span>
                <span className="font-medium text-grayScale-600">
                  {startEntry}–{endEntry}
                </span>
                <span>of</span>
                <span className="font-medium text-grayScale-600">{totalCount}</span>
                <span className="mr-4">entries</span>
                <span className="border-l pl-4">Rows per page</span>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
                  >
                    {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => safePage > 1 && setPage(safePage - 1)}
                  disabled={safePage === 1}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[6px] border bg-white text-grayScale-500",
                    safePage === 1 && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {getPageNumbers().map((n, idx) =>
                  typeof n === "string" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-grayScale-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "h-8 w-8 rounded-[6px] border text-sm font-medium",
                        n === safePage
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "bg-white text-grayScale-600 hover:bg-grayScale-50",
                      )}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => safePage < totalPages && setPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[6px] border bg-white text-grayScale-500",
                    safePage === totalPages && "cursor-not-allowed opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Add Sub-category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-grayScale-700">Add New Sub-category</h2>
              <button
                onClick={handleCloseModal}
                className="grid h-8 w-8 place-items-center rounded-[6px] text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {saveError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {saveError}
                </div>
              )}

              <div>
                <label
                  htmlFor="subcat-name"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="subcat-name"
                  placeholder="Enter sub-category name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="subcat-description"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Description
                </label>
                <textarea
                  id="subcat-description"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-xl border border-grayScale-200 bg-white px-3.5 py-2.5 text-sm transition-colors ring-offset-background placeholder:text-grayScale-400 focus-visible:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="subcat-order" className="mb-2 block text-sm font-medium text-grayScale-600">
                  Display order
                </label>
                <Input
                  id="subcat-order"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-grayScale-50 px-3 py-2 text-xs text-grayScale-400">
                Category: <span className="font-semibold text-grayScale-600">{category?.name}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCloseModal} disabled={saving} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Sub-category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-category Modal */}
      {showEditModal && subCategoryToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-grayScale-700">Edit Sub-category</h2>
              <button
                onClick={handleCloseEditModal}
                className="grid h-8 w-8 place-items-center rounded-[6px] text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {updateError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {updateError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-subcat-name"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <Input
                  id="edit-subcat-name"
                  placeholder="Enter sub-category name"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-subcat-description"
                  className="mb-2 block text-sm font-medium text-grayScale-600"
                >
                  Description
                </label>
                <textarea
                  id="edit-subcat-description"
                  placeholder="Optional description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-xl border border-grayScale-200 bg-white px-3.5 py-2.5 text-sm transition-colors ring-offset-background placeholder:text-grayScale-400 focus-visible:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100"
                />
              </div>

              <div>
                <label htmlFor="edit-subcat-order" className="mb-2 block text-sm font-medium text-grayScale-600">
                  Display order
                </label>
                <Input
                  id="edit-subcat-order"
                  type="number"
                  min={0}
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCloseEditModal} disabled={updating} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                className="w-full bg-brand-500 shadow-sm transition-all hover:bg-brand-600 hover:shadow-md sm:w-auto"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Update Sub-category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sub-category Modal */}
      {showDeleteModal && subCategoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-grayScale-700">Delete Sub-category</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="grid h-8 w-8 place-items-center rounded-[6px] text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-center text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-grayScale-700">{subCategoryToDelete.name}</span>? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="w-full bg-red-500 shadow-sm transition-all hover:bg-red-600 hover:shadow-md sm:w-auto"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
