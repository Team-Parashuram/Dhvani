import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useThemeStore } from "@/store/themeStore"
import { Upload, FileText, AlertCircle, CheckCircle, Eye, Activity, Brain } from "lucide-react"
import { toast } from "react-hot-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const TBDetection = () => {
    const [tbFile, setTbFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [heatmapImage, setHeatmapImage] = useState<string | null>(null)
    const [originalImage, setOriginalImage] = useState<string | null>(null)
    const { theme } = useThemeStore()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setTbFile(file)
            setAnalysisResult(null)
            setHeatmapImage(null)
            
            // Create preview of original image
            const reader = new FileReader()
            reader.onload = (e) => {
                setOriginalImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAnalyze = async () => {
        if (!tbFile) {
            toast.error("Please select an image file first.")
            return
        }

        setIsAnalyzing(true)
        try {
            const formData = new FormData()
            formData.append('file', tbFile)
            
            // Call your Flask backend endpoint
            const response = await fetch('http://localhost:5001/vit_analyze', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            
            if (result.success) {
                setAnalysisResult(result)
                setHeatmapImage(`data:image/png;base64,${result.heatmap_image}`)
                toast.success("TB analysis completed successfully!")
            } else {
                throw new Error(result.error || "Analysis failed")
            }
        } catch (error) {
            console.error("Error analyzing TB image:", error)
            toast.error("Failed to analyze TB image. Please ensure the backend server is running.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const resetAnalysis = () => {
        setTbFile(null)
        setAnalysisResult(null)
        setHeatmapImage(null)
        setOriginalImage(null)
    }

    const getResultColor = (prediction: string) => {
        if (prediction === "TB Detected") {
            return theme === "light" ? "text-red-600" : "text-red-400"
        }
        return theme === "light" ? "text-green-600" : "text-green-400"
    }

    const getResultBgColor = (prediction: string) => {
        if (prediction === "TB Detected") {
            return theme === "light" ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30"
        }
        return theme === "light" ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30"
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
                    TB Detection with AI
                </h1>
                <p className={`mt-2 text-sm ${
                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                    Upload chest X-ray images for AI-powered tuberculosis detection and analysis
                </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upload Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
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
                                    <Brain className={`w-5 h-5 ${
                                        theme === "light" ? "text-blue-600" : "text-primary"
                                    }`} />
                                </div>
                                AI TB Detection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                                accept=".jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            Upload Chest X-ray Image
                                        </label>
                                        <p className={`text-xs mt-1 ${
                                            theme === "light" ? "text-gray-500" : "text-base-content/70"
                                        }`}>
                                            Supported formats: JPG, PNG (Max 16MB)
                                        </p>
                                    </div>
                                </div>

                                {tbFile && (
                                    <div className={`p-3 rounded-lg border ${
                                        theme === "light" ? "bg-white border-gray-200" : "bg-base-100/50 border-base-300"
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <FileText className={`w-4 h-4 mr-2 ${
                                                    theme === "light" ? "text-blue-500" : "text-primary"
                                                }`} />
                                                <span className={`text-sm ${
                                                    theme === "light" ? "text-gray-700" : "text-base-content"
                                                }`}>
                                                    {tbFile.name}
                                                </span>
                                                <span className={`text-xs ml-2 ${
                                                    theme === "light" ? "text-gray-500" : "text-base-content/70"
                                                }`}>
                                                    ({Math.round(tbFile.size / 1024)} KB)
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={resetAnalysis}
                                                className={`text-red-500 hover:text-red-700 hover:${
                                                    theme === "light" ? "bg-red-50" : "bg-red-500/10"
                                                }`}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={!tbFile || isAnalyzing}
                                        className={`flex-1 h-12 text-base font-semibold ${
                                            theme === "light"
                                                ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-base-300"
                                        } transition-all duration-200 disabled:cursor-not-allowed`}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Activity className="w-5 h-5 mr-2" />
                                                Analyze Image
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {!tbFile && (
                                    <Alert className={`border-l-4 ${
                                        theme === "light" 
                                            ? "border-l-blue-500 bg-blue-50 border-blue-200" 
                                            : "border-l-info bg-info/10 border-info/30"
                                    }`}>
                                        <AlertCircle className={`w-4 h-4 ${
                                            theme === "light" ? "text-blue-500" : "text-info"
                                        }`} />
                                        <AlertDescription className={`${
                                            theme === "light" ? "text-blue-700" : "text-info"
                                        }`}>
                                            Please upload a chest X-ray image to begin TB detection analysis.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Results Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: 0.2 }}
                >
                    <Card className={`${
                        theme === "light"
                            ? "bg-white border-gray-200 shadow-sm"
                            : "bg-base-200/50 backdrop-blur-sm border-primary/10 shadow-sm"
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
                                    <Eye className={`w-5 h-5 ${
                                        theme === "light" ? "text-green-600" : "text-primary"
                                    }`} />
                                </div>
                                Analysis Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {analysisResult ? (
                                <div className="space-y-4">
                                    {/* Prediction Result */}
                                    <Alert className={`border-l-4 ${getResultBgColor(analysisResult.prediction)}`}>
                                        <CheckCircle className={`w-4 h-4 ${getResultColor(analysisResult.prediction)}`} />
                                        <AlertDescription>
                                            <div className={`font-semibold text-lg ${getResultColor(analysisResult.prediction)}`}>
                                                {analysisResult.prediction}
                                            </div>
                                            <div className={`text-sm mt-1 ${
                                                theme === "light" ? "text-gray-600" : "text-base-content/70"
                                            }`}>
                                                Confidence: TB {(analysisResult.confidence.tb_detected * 100).toFixed(1)}% | 
                                                Normal {(analysisResult.confidence.normal * 100).toFixed(1)}%
                                            </div>
                                        </AlertDescription>
                                    </Alert>

                                    {/* Image Comparison */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {originalImage && (
                                            <div className="space-y-2">
                                                <h4 className={`text-sm font-semibold ${
                                                    theme === "light" ? "text-gray-700" : "text-base-content"
                                                }`}>
                                                    Original Image
                                                </h4>
                                                <div className={`border rounded-lg overflow-hidden ${
                                                    theme === "light" ? "border-gray-200" : "border-base-300"
                                                }`}>
                                                    <img 
                                                        src={originalImage} 
                                                        alt="Original X-ray" 
                                                        className="object-cover w-full h-48"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {heatmapImage && (
                                            <div className="space-y-2">
                                                <h4 className={`text-sm font-semibold ${
                                                    theme === "light" ? "text-gray-700" : "text-base-content"
                                                }`}>
                                                    AI Heatmap Analysis
                                                </h4>
                                                <div className={`border rounded-lg overflow-hidden ${
                                                    theme === "light" ? "border-gray-200" : "border-base-300"
                                                }`}>
                                                    <img 
                                                        src={heatmapImage} 
                                                        alt="AI Heatmap" 
                                                        className="object-cover w-full h-48"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Disclaimer */}
                                    <Alert className={`${
                                        theme === "light" 
                                            ? "bg-yellow-50 border-yellow-200" 
                                            : "bg-warning/10 border-warning/30"
                                    }`}>
                                        <AlertCircle className={`w-4 h-4 ${
                                            theme === "light" ? "text-yellow-600" : "text-warning"
                                        }`} />
                                        <AlertDescription className={`text-sm ${
                                            theme === "light" ? "text-yellow-700" : "text-warning"
                                        }`}>
                                            This AI analysis is for informational purposes only. Please consult with a qualified healthcare professional for proper medical diagnosis and treatment.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            ) : (
                                <div className={`text-center py-8 ${
                                    theme === "light" ? "text-gray-500" : "text-base-content/50"
                                }`}>
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">
                                        Upload an image and click "Analyze Image" to see results
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

export default TBDetection