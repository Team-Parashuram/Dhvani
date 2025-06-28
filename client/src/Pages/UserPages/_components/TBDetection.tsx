import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axiosInstance from "@/util/axiosInstance"
import { motion } from "framer-motion"
import { useThemeStore } from "@/store/themeStore"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const TBDetection = () => {
    const [tbFiles, setTbFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { theme } = useThemeStore()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 3)
        setTbFiles(files)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (tbFiles.length === 0) {
            toast.error("At least one file is required for TB report.")
            return
        }

        setIsSubmitting(true)
        try {
            const data = new FormData()
            tbFiles.forEach((file) => data.append("files", file))
            await axiosInstance.post("/user/tb-report", data, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            setTbFiles([])
            toast.success("TB report submitted successfully.")
        } catch (error) {
            console.error("Error submitting TB report:", error)
            toast.error("Failed to submit TB report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const removeFile = (index: number) => {
        setTbFiles(prev => prev.filter((_, i) => i !== index))
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
                    TB Detection
                </h1>
                <p className={`mt-2 text-sm ${
                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                    Upload your TB medical reports for analysis and diagnosis
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
                                <FileText className={`w-5 h-5 ${
                                    theme === "light" ? "text-blue-600" : "text-primary"
                                }`} />
                            </div>
                            TB (Tuberculosis) Report Submission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg border-2 border-dashed ${
                                    theme === "light" 
                                        ? "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50" 
                                        : "border-base-300 bg-base-100/50 hover:border-primary hover:bg-primary/5"
                                } transition-all duration-200`}>
                                    <div className="text-center">
                                        <Upload className={`w-8 h-8 mx-auto mb-2 ${
                                            theme === "light" ? "text-gray-400" : "text-base-content/50"
                                        }`} />
                                        <label className={`block text-sm font-medium cursor-pointer ${
                                            theme === "light" ? "text-gray-700" : "text-base-content"
                                        }`}>
                                            <Input
                                                type="file"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            Upload TB Report Files
                                        </label>
                                        <p className={`text-xs mt-1 ${
                                            theme === "light" ? "text-gray-500" : "text-base-content/70"
                                        }`}>
                                            Select up to 3 files (JPG, PNG, PDF, DOC)
                                        </p>
                                    </div>
                                </div>


                                {tbFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <label className={`text-sm font-semibold uppercase tracking-wide ${
                                            theme === "light" ? "text-gray-500" : "text-base-content/70"
                                        }`}>
                                            Selected Files ({tbFiles.length}/3)
                                        </label>
                                        {tbFiles.map((file, index) => (
                                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                                                theme === "light" ? "bg-white border-gray-200" : "bg-base-100/50 border-base-300"
                                            }`}>
                                                <div className="flex items-center">
                                                    <FileText className={`w-4 h-4 mr-2 ${
                                                        theme === "light" ? "text-blue-500" : "text-primary"
                                                    }`} />
                                                    <span className={`text-sm ${
                                                        theme === "light" ? "text-gray-700" : "text-base-content"
                                                    }`}>
                                                        {file.name}
                                                    </span>
                                                    <span className={`text-xs ml-2 ${
                                                        theme === "light" ? "text-gray-500" : "text-base-content/70"
                                                    }`}>
                                                        ({Math.round(file.size / 1024)} KB)
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                    className={`text-red-500 hover:text-red-700 hover:${
                                                        theme === "light" ? "bg-red-50" : "bg-red-500/10"
                                                    }`}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {tbFiles.length === 0 && (
                                    <Alert className={`border-l-4 ${
                                        theme === "light" 
                                            ? "border-l-orange-500 bg-orange-50 border-orange-200" 
                                            : "border-l-warning bg-warning/10 border-warning/30"
                                    }`}>
                                        <AlertCircle className={`w-4 h-4 ${
                                            theme === "light" ? "text-orange-500" : "text-warning"
                                        }`} />
                                        <AlertDescription className={`${
                                            theme === "light" ? "text-orange-700" : "text-warning"
                                        }`}>
                                            At least one file is required for TB report submission.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || tbFiles.length === 0}
                                className={`w-full h-12 text-base font-semibold ${
                                    theme === "light"
                                        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-base-300"
                                } transition-all duration-200 disabled:cursor-not-allowed`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Submit TB Report
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

export default TBDetection