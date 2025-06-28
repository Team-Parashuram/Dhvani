import { useState } from "react";
import axios from "axios";
import { useUserStore } from "@/store/useUserStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import { 
    Apple, 
    TrendingUp, 
    Calendar, 
    Utensils, 
    Coffee, 
    Sun, 
    Moon, 
    AlertCircle,
    ChefHat,
    Activity
} from "lucide-react";
import { toast } from "react-hot-toast";

const base_link = "https://nutrition-calculator-hvzj.onrender.com";

type WeeklyPlan = Record<
    string,
    Record<"breakfast" | "lunch" | "dinner", string>
>;

const Nutrition = () => {
    const [inputDiet, setInputDiet] = useState("");
    const [grade, setGrade] = useState<string | null>(null);
    const [dietPlan, setDietPlan] = useState<WeeklyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const user = useUserStore((s) => s.user);
    const { theme } = useThemeStore();

    const getGradeColor = (grade: string) => {
        const gradeUpper = grade.toUpperCase();
        if (gradeUpper.includes('A')) return "bg-green-100 text-green-800 border-green-200";
        if (gradeUpper.includes('B')) return "bg-blue-100 text-blue-800 border-blue-200";
        if (gradeUpper.includes('C')) return "bg-yellow-100 text-yellow-800 border-yellow-200";
        return "bg-red-100 text-red-800 border-red-200";
    };

    const getMealIcon = (mealType: string) => {
        switch (mealType) {
            case 'breakfast': return <Coffee className="w-4 h-4" />;
            case 'lunch': return <Sun className="w-4 h-4" />;
            case 'dinner': return <Moon className="w-4 h-4" />;
            default: return <Utensils className="w-4 h-4" />;
        }
    };

    const getNutrition = async () => {
        try {
            if(!user){
                toast.error("User information is missing. Please complete your profile.");
                return;
            }
            if(!inputDiet.trim()) {
                toast.error("Please enter your diet information.");
                return;
            }
            setIsLoading(true);
            const payload = {
                diet: String(inputDiet).trim(),
                weight: String(user?.weight),
                height: String(user?.height),
                gender: String(user?.gender),
                bloodGroup: String(user?.bloodGroup),
            };

            const res = await axios.post(`${base_link}/api/food`, payload);

            if (res.status === 200) {
                const [nutritionGrade, planString] = res.data.data as [string, string];
                setGrade(nutritionGrade);

                // Parse the plan string
                const planObj = {} as WeeklyPlan;
                let currentDay: string | null = null;

                planString.split(/\r?\n/).forEach((raw) => {
                    const line = raw.trim();
                    const dayMatch = line.match(/^"(\w+)":\s*\[/);
                    if (dayMatch) {
                        currentDay = dayMatch[1];
                        planObj[currentDay] = { breakfast: "", lunch: "", dinner: "" };
                        return;
                    }
                    const mealMatch = line.match(/^"(\w+)":\s*"(.+?)"/);
                    if (mealMatch && currentDay) {
                        const [, mealType, mealDesc] = mealMatch;
                        // @ts-ignore
                        planObj[currentDay][mealType] = mealDesc;
                    }
                });
                
                setDietPlan(planObj);
                toast.success("Nutrition analysis completed successfully!");
            } else {
                toast.error("Failed to fetch nutrition data. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching nutrition data:", err);
            toast.error("An error occurred while analyzing your diet. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setInputDiet("");
        setGrade(null);
        setDietPlan(null);
    };

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
                    Nutrition Calculator
                </h1>
                <p className={`mt-2 text-sm md:text-base ${
                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                    Analyze your daily diet and get personalized nutrition recommendations
                </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Input Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-1"
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
                                    <Apple className={`w-5 h-5 ${
                                        theme === "light" ? "text-green-600" : "text-primary"
                                    }`} />
                                </div>
                                Diet Input
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center mb-2">
                                        <ChefHat className={`w-4 h-4 mr-2 ${
                                            theme === "light" ? "text-gray-500" : "text-base-content/70"
                                        }`} />
                                        <label className={`text-sm font-semibold uppercase tracking-wide ${
                                            theme === "light" ? "text-gray-700" : "text-base-content"
                                        }`}>
                                            Today's Diet
                                        </label>
                                    </div>
                                    <Textarea
                                        placeholder="Enter what you've eaten today (e.g., orange, apple, chicken, rice, vegetables...)"
                                        value={inputDiet}
                                        onChange={(e) => setInputDiet(e.target.value)}
                                        rows={6}
                                        className={`${
                                            theme === "light" 
                                                ? "bg-gray-50 border-gray-300 focus:border-green-500 focus:ring-green-500 text-slate-700" 
                                                : "bg-base-100 border-base-300 focus:border-primary focus:ring-primary"
                                        } transition-colors duration-200`}
                                    />
                                </div>

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
                                        Tip
                                    </AlertTitle>
                                    <AlertDescription className={`${
                                        theme === "light" ? "text-blue-600" : "text-info"
                                    }`}>
                                        Be as detailed as possible about portions and cooking methods for better analysis.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={getNutrition}
                                        disabled={isLoading || !inputDiet.trim()}
                                        className={`flex-1 h-12 text-lg font-semibold ${
                                            theme === "light" 
                                                ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300" 
                                                : "bg-primary hover:bg-primary/90 text-primary-content disabled:bg-base-300"
                                        } transition-colors duration-200`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Activity className="w-5 h-5 mr-2" />
                                                Analyze
                                            </>
                                        )}
                                    </Button>
                                    {(grade || dietPlan) && (
                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                            className="px-4"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Results */}
                <div className="space-y-6 lg:col-span-2">
                    {grade && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2 }}
                        >
                            <Card className={`${
                                theme === "light"
                                    ? "bg-white border-gray-200 shadow-sm"
                                    : "bg-base-200/50 backdrop-blur-sm border-primary/10"
                            }`}>
                                <CardHeader>
                                    <CardTitle className={`flex items-center ${
                                        theme === "light" ? "text-gray-800" : ""
                                    }`}>
                                        <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
                                        Nutrition Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-lg font-medium ${
                                            theme === "light" ? "text-gray-700" : "text-base-content"
                                        }`}>
                                            Overall Grade:
                                        </span>
                                        <Badge className={`text-lg px-4 py-2 font-bold ${getGradeColor(grade)}`}>
                                            {grade}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {dietPlan && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.3 }}
                        >
                            <Card className={`${
                                theme === "light"
                                    ? "bg-white border-gray-200 shadow-sm"
                                    : "bg-base-200/50 backdrop-blur-sm border-primary/10"
                            }`}>
                                <CardHeader>
                                    <CardTitle className={`flex items-center ${
                                        theme === "light" ? "text-gray-800" : ""
                                    }`}>
                                        <Calendar className="w-6 h-6 mr-2 text-emerald-500" />
                                        Weekly Diet Plan
                                    </CardTitle>
                                <Alert className={`${
                                                                theme === "light" 
                                                                    ? "bg-green-50 border-green-200 border-l-4 green-l-green-500" 
                                                                    : "bg-info/10 border-info/30 border-l-4 border-l-info"
                                                            }`}>
                                                                <AlertCircle className={`w-4 h-4 ${
                                                                    theme === "light" ? "text-green-500" : "text-info"
                                                                }`} />
                                                                <AlertTitle className={`${
                                                                    theme === "light" ? "text-emerald-700" : "text-info"
                                                                } font-semibold`}>
                                                                    Important Note
                                                                </AlertTitle>
                                                                <AlertDescription className={`${
                                                                    theme === "light" ? "text-green-600" : "text-info"
                                                                }`}>
                                                                    This chart is prepared based on your weight, height, gender, and blood group.
                                                                    Every detail is structured carefully to suit your nutritional profile.
                                                                </AlertDescription>
                                                            </Alert>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                        {Object.entries(dietPlan).map(([day, meals], index) => (
                                            <motion.div
                                                key={day}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                                className={`p-4 rounded-lg border ${
                                                    theme === "light" 
                                                        ? "bg-gray-50 border-gray-200 hover:bg-gray-100" 
                                                        : "bg-base-100/50 border-base-300 hover:bg-base-100/70"
                                                } transition-colors duration-200`}
                                            >
                                                <h5 className={`font-bold text-lg capitalize mb-3 ${
                                                    theme === "light" ? "text-gray-800" : "text-base-content"
                                                }`}>
                                                    {day}
                                                </h5>
                                                <div className="space-y-3">
                                                    {Object.entries(meals).map(([mealType, mealDesc]) => (
                                                        <div key={mealType} className="flex items-start space-x-3">
                                                            <div className={`p-2 rounded-full ${
                                                                theme === "light" ? "bg-white shadow-sm" : "bg-base-200"
                                                            }`}>
                                                                {getMealIcon(mealType)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h6 className={`font-semibold capitalize text-sm ${
                                                                    theme === "light" ? "text-gray-700" : "text-base-content"
                                                                }`}>
                                                                    {mealType}
                                                                </h6>
                                                                <p className={`text-sm mt-1 ${
                                                                    theme === "light" ? "text-gray-600" : "text-base-content/80"
                                                                }`}>
                                                                    {mealDesc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Analysis Progress Card */}
                            <Card className={`${
                                theme === "light"
                                    ? "bg-white border-gray-200 shadow-sm"
                                    : "bg-base-200/50 backdrop-blur-sm border-primary/10"
                            }`}>
                                <CardHeader>
                                    <CardTitle className={`flex items-center ${
                                        theme === "light" ? "text-gray-800" : ""
                                    }`}>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="mr-3"
                                        >
                                            <Activity className="w-6 h-6 text-green-500" />
                                        </motion.div>
                                        Analyzing Your Nutrition
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Progress Steps */}
                                        <div className="space-y-3">
                                            {[
                                                { step: "Processing food items", icon: "🍎", delay: 0 },
                                                { step: "Calculating nutritional values", icon: "⚖️", delay: 1 },
                                                { step: "Analyzing dietary patterns", icon: "📊", delay: 2 },
                                                { step: "Generating personalized plan", icon: "📋", delay: 3 }
                                            ].map((item, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: item.delay * 0.5 }}
                                                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                                                        theme === "light" ? "bg-gray-50" : "bg-base-100/50"
                                                    }`}
                                                >
                                                    <span className="text-2xl">{item.icon}</span>
                                                    <span className={`${
                                                        theme === "light" ? "text-gray-700" : "text-base-content"
                                                    }`}>
                                                        {item.step}
                                                    </span>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ delay: item.delay * 0.5 + 0.5, duration: 1 }}
                                                        className="ml-auto h-1 bg-green-500 rounded-full flex-1 max-w-[100px]"
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                        
                                        {/* Floating Elements */}
                                        {/* <div className="relative h-20 overflow-hidden">
                                            {["🥗", "🥑", "🍊", "🥕", "🫐", "🍇"].map((emoji, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="absolute text-2xl"
                                                    initial={{ 
                                                        x: -50, 
                                                        y: Math.random() * 60,
                                                        opacity: 0 
                                                    }}
                                                    animate={{ 
                                                        x: 400, 
                                                        y: Math.random() * 60,
                                                        opacity: [0, 1, 1, 0] 
                                                    }}
                                                    transition={{
                                                        duration: 4,
                                                        delay: index * 0.5,
                                                        repeat: Infinity,
                                                        ease: "linear"
                                                    }}
                                                >
                                                    {emoji}
                                                </motion.div>
                                            ))}
                                        </div> */}
                                    </div>
                                </CardContent>
                            </Card> 

                            {/* AI Insights Preview */}
                            <Card className={`${
                                theme === "light"
                                    ? "bg-white border-gray-200 shadow-sm"
                                    : "bg-base-200/50 backdrop-blur-sm border-primary/10"
                            }`}>
                                <CardContent className="p-6">
                                    <div className="space-y-4 text-center">
                                        <motion.div
                                            animate={{ 
                                                scale: [1, 1.1, 1],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{ 
                                                duration: 2, 
                                                repeat: Infinity,
                                                repeatType: "reverse"
                                            }}
                                            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                                                theme === "light" ? "bg-gradient-to-r from-green-100 to-blue-100" : "bg-gradient-to-r from-primary/20 to-secondary/20"
                                            }`}
                                        >
                                            🤖
                                        </motion.div>
                                        <div>
                                            <h3 className={`text-lg font-semibold mb-2 ${
                                                theme === "light" ? "text-gray-800" : "text-base-content"
                                            }`}>
                                                AI Health Assistant is Working
                                            </h3>
                                            <motion.p 
                                                key={Math.random()}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`text-sm ${
                                                    theme === "light" ? "text-gray-600" : "text-base-content/70"
                                                }`}
                                            >
                                                {[
                                                    "Consulting nutritional databases...",
                                                    "Cross-referencing with health guidelines...",
                                                    "Personalizing recommendations based on your profile...",
                                                    "Optimizing meal suggestions for your goals...",
                                                    "Finalizing your personalized nutrition plan..."
                                                ][Math.floor(Date.now() / 2000) % 5]}
                                            </motion.p>
                                        </div>
                                        
                                        {/* Pulse Animation */}
                                        <div className="flex justify-center space-x-2">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className={`w-3 h-3 rounded-full ${
                                                        theme === "light" ? "bg-green-500" : "bg-primary"
                                                    }`}
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        opacity: [0.7, 1, 0.7]
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        delay: i * 0.2
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {!grade && !isLoading && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2 }}
                        >
                            <Card className={`${
                                theme === "light"
                                    ? "bg-white border-gray-200 shadow-sm"
                                    : "bg-base-200/50 backdrop-blur-sm border-primary/10"
                            }`}>
                                <CardContent className="p-8 text-center">
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                                        theme === "light" ? "bg-gray-100" : "bg-base-300/50"
                                    }`}>
                                        <Apple className={`w-8 h-8 ${
                                            theme === "light" ? "text-gray-400" : "text-base-content/50"
                                        }`} />
                                    </div>
                                    <h3 className={`text-lg font-semibold mb-2 ${
                                        theme === "light" ? "text-gray-800" : "text-base-content"
                                    }`}>
                                        Ready to Analyze Your Diet?
                                    </h3>
                                    <p className={`${
                                        theme === "light" ? "text-gray-600" : "text-base-content/70"
                                    }`}>
                                        Enter your daily food intake to get personalized nutrition insights and a weekly meal plan.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Nutrition;