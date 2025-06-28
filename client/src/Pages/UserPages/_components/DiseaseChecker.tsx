"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import axiosInstance from "@/util/axiosInstance"
import { motion } from "framer-motion"
import { useThemeStore } from "@/store/themeStore"
import { Activity, FileText, Upload, AlertCircle, Stethoscope, ClipboardList } from "lucide-react"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


const DiseaseChecker = () => {
    const [formData, setFormData] = useState({
        currentSymptoms: "",
        previousDiseases: "",
        files: [] as File[],
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { theme } = useThemeStore()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 3)
        setFormData({ ...formData, files })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if(!formData.currentSymptoms || !formData.previousDiseases || formData.files.length === 0) {
            toast.error("All fields are required.")
            return
        }

        setIsSubmitting(true)
        const data = new FormData()
        data.append("currentSymptoms", formData.currentSymptoms)
        data.append("previousDiseases", formData.previousDiseases)
        formData.files.forEach((file) => data.append("files", file))

        try {
            await axiosInstance.post("/user/disease-detection", data, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            toast.success("Disease detection report submitted successfully.")
            setFormData({ currentSymptoms: "", previousDiseases: "", files: [] })
        } catch (error) {
            console.error("Error submitting disease detection:", error)
            toast.error("Failed to submit report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeFile = (index: number) => {
        const newFiles = formData.files.filter((_, i) => i !== index)
        setFormData({ ...formData, files: newFiles })
    }

    return (
        <div className="container p-4 mx-auto md:p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-6 md:mb-8"
            >
                <h1 className={`text-2xl md:text-4xl font-bold ${
                    theme === "light" ? "text-gray-800" : "text-primary"
                }`}>
                    Disease Checker
                </h1>
                <p className={`mt-2 text-sm md:text-base ${
                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                    Submit your symptoms and medical history for AI-powered health analysis
                </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }}
            >
                <Card className={`${
                    theme === "light"
                        ? "bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                        : "bg-base-200/50 backdrop-blur-sm border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-200"
                } overflow-hidden`}>
                    <CardHeader className={`${
                        theme === "light" 
                            ? "bg-gray-50 border-b border-gray-200" 
                            : "bg-base-300/30 border-b border-primary/10"
                    }`}>
                        <CardTitle className={`flex items-center text-lg font-semibold ${
                            theme === "light" ? "text-gray-800" : "text-primary"
                        }`}>
                            <div className={`p-2 rounded-lg mr-3 ${
                                theme === "light" ? "bg-white shadow-sm" : "bg-base-100/50"
                            }`}>
                                <Activity className={`w-5 h-5 ${
                                    theme === "light" ? "text-green-600" : "text-primary"
                                }`} />
                            </div>
                            Health Assessment Form
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Current Symptoms Section */}
                            <div className="space-y-3">
                                <div className="flex items-center mb-2">
                                    <Stethoscope className={`w-4 h-4 mr-2 ${
                                        theme === "light" ? "text-gray-500" : "text-base-content/70"
                                    }`} />
                                    <label className={`text-sm font-semibold uppercase tracking-wide ${
                                        theme === "light" ? "text-gray-700" : "text-base-content"
                                    }`}>
                                        Current Symptoms
                                    </label>
                                </div>
                                <Textarea
                                    name="currentSymptoms"
                                    placeholder="Describe your current symptoms in detail (e.g., headache for 3 days, fever, nausea...)"
                                    value={formData.currentSymptoms}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`${
                                        theme === "light" 
                                            ? "bg-gray-50 border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                            : "bg-base-100 border-base-300 focus:border-primary focus:ring-primary"
                                    } transition-colors duration-200`}
                                />
                            </div>

                            {/* Previous Diseases Section */}
                            <div className="space-y-3">
                                <div className="flex items-center mb-2">
                                    <ClipboardList className={`w-4 h-4 mr-2 ${
                                        theme === "light" ? "text-gray-500" : "text-base-content/70"
                                    }`} />
                                    <label className={`text-sm font-semibold uppercase tracking-wide ${
                                        theme === "light" ? "text-gray-700" : "text-base-content"
                                    }`}>
                                        Medical History
                                    </label>
                                </div>
                                <Textarea
                                    name="previousDiseases"
                                    placeholder="List any previous diseases, conditions, medications, or allergies..."
                                    value={formData.previousDiseases}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`${
                                        theme === "light" 
                                            ? "bg-gray-50 border-gray-300 focus:border-green-500 focus:ring-green-500" 
                                            : "bg-base-100 border-base-300 focus:border-primary focus:ring-primary"
                                    } transition-colors duration-200`}
                                />
                            </div>

                            {/* File Upload Section */}
                            <div className="space-y-3">
                                <div className="flex items-center mb-2">
                                    <Upload className={`w-4 h-4 mr-2 ${
                                        theme === "light" ? "text-gray-500" : "text-base-content/70"
                                    }`} />
                                    <label className={`text-sm font-semibold uppercase tracking-wide ${
                                        theme === "light" ? "text-gray-700" : "text-base-content"
                                    }`}>
                                        Medical Documents
                                    </label>
                                </div>
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                                    theme === "light" 
                                        ? "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50" 
                                        : "border-base-300 bg-base-100 hover:border-primary hover:bg-primary/5"
                                } transition-colors duration-200`}>
                                    <FileText className={`w-8 h-8 mx-auto mb-2 ${
                                        theme === "light" ? "text-gray-400" : "text-base-content/50"
                                    }`} />
                                    <Input
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={`cursor-pointer text-sm ${
                                            theme === "light" ? "text-gray-600" : "text-base-content/70"
                                        }`}
                                    >
                                        Click to upload medical reports, test results, or images (max 3 files)
                                    </label>
                                </div>
                                
                                {/* File List */}
                                {formData.files.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.files.map((file, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-2 rounded border ${
                                                    theme === "light" ? "bg-white border-gray-200" : "bg-base-100 border-base-300"
                                                }`}
                                            >
                                                <span className={`text-sm ${
                                                    theme === "light" ? "text-gray-700" : "text-base-content"
                                                }`}>
                                                    {file.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <p className={`text-xs ${
                                    theme === "light" ? "text-gray-500" : "text-base-content/60"
                                }`}>
                                    Selected files: {formData.files.length}/3 • Supported formats: PDF, JPG, PNG, DOC, DOCX
                                </p>
                            </div>

                            {/* Info Alert */}
                            <Alert className={`${
                                theme === "light" 
                                    ? "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500" 
                                    : "bg-info/10 border-info/30 border-l-4 border-l-info"
                            }`}>
                                <AlertCircle className={`w-4 h-4 ${
                                    theme === "light" ? "text-blue-500" : "text-info"
                                }`} />
                                <AlertTitle className={`${
                                    theme === "light" ? "text-blue-700" : "text-info"
                                } font-semibold`}>
                                    Important Note
                                </AlertTitle>
                                <AlertDescription className={`${
                                    theme === "light" ? "text-blue-600" : "text-info"
                                }`}>
                                    This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.
                                </AlertDescription>
                            </Alert>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.currentSymptoms || !formData.previousDiseases || formData.files.length === 0}
                                className={`w-full h-12 text-lg font-semibold ${
                                    theme === "light" 
                                        ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300" 
                                        : "bg-primary hover:bg-primary/90 text-primary-content disabled:bg-base-300"
                                } transition-colors duration-200`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Activity className="w-5 h-5 mr-2" />
                                        Submit Health Assessment
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

export default DiseaseChecker