"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import axiosInstance from "@/util/axiosInstance"
import { motion } from "framer-motion"
import { useThemeStore } from "@/store/themeStore"
import { Activity, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const StrokeDetection = () => {
    const [strokeData, setStrokeData] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { theme } = useThemeStore()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!strokeData.trim()) {
            toast.error("Data is required for Stroke report.")
            return
        }

        setIsSubmitting(true)
        try {
            await axiosInstance.post("/user/stroke-report", { data: strokeData })
            setStrokeData("")
            toast.success("Stroke report submitted successfully.")
        } catch (error) {
            console.error("Error submitting stroke report:", error)
            toast.error("Failed to submit stroke report. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
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
                    Stroke Detection
                </h1>
                <p className={`mt-2 text-sm ${
                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                    Enter stroke report data for analysis and diagnosis
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
                                    theme === "light" ? "text-red-600" : "text-primary"
                                }`} />
                            </div>
                            Stroke Analysis Report Submission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className={`text-sm font-semibold uppercase tracking-wide ${
                                    theme === "light" ? "text-gray-500" : "text-base-content/70"
                                }`}>
                                    Stroke Report Data
                                </label>
                                <Textarea
                                    placeholder="Enter detailed stroke report data, symptoms, medical history, and any relevant information..."
                                    value={strokeData}
                                    onChange={(e) => setStrokeData(e.target.value)}
                                    className={`min-h-[120px] ${
                                        theme === "light" 
                                            ? "bg-white border-gray-300 focus:border-red-400" 
                                            : "bg-base-100 border-base-300 focus:border-primary"
                                    } transition-colors`}
                                    rows={6}
                                />
                                <p className={`text-xs ${
                                    theme === "light" ? "text-gray-500" : "text-base-content/70"
                                }`}>
                                    Provide comprehensive information for accurate analysis
                                </p>

                                {!strokeData.trim() && (
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
                                            Detailed report data is required for stroke analysis.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>


                            <Button
                                type="submit"
                                disabled={isSubmitting || !strokeData.trim()}
                                className={`w-full h-12 text-base font-semibold ${
                                    theme === "light"
                                        ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
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
                                        Submit Stroke Report
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

export default StrokeDetection