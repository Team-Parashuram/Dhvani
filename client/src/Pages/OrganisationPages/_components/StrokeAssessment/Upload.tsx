import toast from "react-hot-toast";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PickerOverlay } from "filestack-react";
import axiosInstance from "@/util/axiosInstance";
import { PatientStore } from "@/store/patient.store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useThemeStore } from "@/store/themeStore";
import { motion } from "framer-motion";
import {
  Upload,
  File,
  X,
  AlertTriangle,
  Send,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  Activity,
  User,
  Stethoscope,
  Brain,
  Heart,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface ThrombectomyProps {
  nextTab: () => void;
  prevTab: () => void;
  handleSubmit?: () => void;
}

const UploadComponent: React.FC<ThrombectomyProps> = ({ nextTab, prevTab }) => {
  const patient = PatientStore((state) => state.patient);
  const patientEmail = patient?.patientEmail;

  const navigate = useNavigate();

  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isPickerOverlayVisible, setIsPickerOverlayVisible] = useState(false);
  const { theme } = useThemeStore();

  const options = {
    accept: [
      ".pdf",
      ".doc",
      ".csv",
      ".ppt",
      ".txt",
      ".xls",
      ".pptx",
      ".docx",
      ".xlsx",
      "image/*",
      "video/*",
      "image/png",
      "image/jpeg",
    ],
    fromSources: ["url", "camera", "local_file_system"],
    transformations: { crop: true, circle: true, rotate: true },
    maxFiles: 5,
    storeTo: { location: "s3" },
  };

  const sendDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!patientEmail || !documentUrl || !documentName) {
      toast.error(
        "Missing required fields: Patient email, document name, or document URL."
      );
      return;
    }

    try {
      await axiosInstance.put("/patient/sendDocument", {
        documentUrl,
        patientEmail,
        documentName,
      });

      setDocumentUrl("");
      setDocumentName("");
      toast.success("Document sent successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send document");
    }
  };

  const onSuccess = (result: any) => {
    if (result.filesUploaded.length > 0) {
      setDocumentUrl(result.filesUploaded[0].url);
      setDocumentName(result.filesUploaded[0].filename || "Uploaded File");
      toast.success("File uploaded successfully");
      setIsPickerOverlayVisible(false);
    }
  };

  const onError = (error: any) => {
    console.error("Upload error:", error);
    toast.error("File upload failed");
    setIsPickerOverlayVisible(false);
  };

  const openFilePicker = () => {
    setIsPickerOverlayVisible(true);
  };

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const selectCategory = async () => {
    enum PatientConditionEnum {
      HEMORRHAGE = "hemorrhage",
      NO_HEMORRHAGE = "no_hemorrhage",
      LARGE_VESSEL_OCCLUSION = "large_vessel_occlusion",
    }

    if (selectedOption) {
      const patientCondition =
        selectedOption === "Hemorrhage"
          ? PatientConditionEnum.HEMORRHAGE
          : selectedOption === "No Hemorrhage"
          ? PatientConditionEnum.NO_HEMORRHAGE
          : PatientConditionEnum.LARGE_VESSEL_OCCLUSION;

      try {
        await axiosInstance.put("/patient/tellCondition", {
          patientEmail,
          patientCondition,
        });

        if (patientCondition === PatientConditionEnum.HEMORRHAGE) {
          navigate("/patient/hemorrhage");
        } else if (patientCondition === PatientConditionEnum.NO_HEMORRHAGE) {
          navigate("/patient/no-hemorrhage");
        } else {
          navigate("/patient/occlusionclot");
        }
      } catch (error) {
        toast.error("Failed to update patient condition");
        console.error(error);
      }
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "Hemorrhage":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "No Hemorrhage":
        return <Activity className="w-4 h-4 text-green-500" />;
      case "Large vessel occlusion":
        return <Brain className="w-4 h-4 text-blue-500" />;
      default:
        return <Stethoscope className="w-4 h-4 text-gray-500" />;
    }
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
          Medical Imaging Upload & Analysis
        </h1>
        <p className={`mt-2 text-sm md:text-base ${
          theme === "light" ? "text-gray-600" : "text-base-content/70"
        }`}>
          Upload CTA and CT scans for comprehensive stroke assessment and condition analysis
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
              CTA and CT Upload System
            </CardTitle>
            {patientEmail && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center p-3 mt-2 border rounded-lg ${
                  theme === "light" 
                    ? "bg-blue-50 border-blue-200" 
                    : "bg-primary/10 border-primary/20"
                }`}
              >
                <User className={`w-4 h-4 mr-2 ${
                  theme === "light" ? "text-blue-600" : "text-primary"
                }`} />
                <span className={`mr-2 text-sm font-medium ${
                  theme === "light" ? "text-gray-700" : "text-base-content"
                }`}>Patient:</span>
                <span className={`text-sm font-semibold ${
                  theme === "light" ? "text-blue-600" : "text-primary"
                }`}>{patientEmail}</span>
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {!patientEmail && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Alert className={`${
                  theme === "light" 
                    ? "bg-red-50 border-red-200 border-l-4 border-l-red-500" 
                    : "bg-destructive/10 border-destructive/30 border-l-4 border-l-destructive"
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    theme === "light" ? "text-red-500" : "text-destructive"
                  }`} />
                  <AlertTitle className={`${
                    theme === "light" ? "text-red-700" : "text-destructive"
                  } font-semibold`}>
                    Patient Selection Required
                  </AlertTitle>
                  <AlertDescription className={`${
                    theme === "light" ? "text-red-600" : "text-destructive"
                  }`}>
                    Please select a patient before uploading medical documents to ensure proper record management.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Condition Selection Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center mb-2">
                <Stethoscope className={`w-4 h-4 mr-2 ${
                  theme === "light" ? "text-gray-500" : "text-base-content/70"
                }`} />
                <label className={`text-sm font-semibold uppercase tracking-wide ${
                  theme === "light" ? "text-gray-700" : "text-base-content"
                }`}>
                  Patient Condition Assessment
                </label>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`justify-between w-full h-12 text-left ${
                      theme === "light" 
                        ? "bg-gray-50 border-gray-300 hover:border-blue-400" 
                        : "bg-base-100 border-base-300 hover:border-primary"
                    } transition-colors duration-200`}
                  >
                    <div className="flex items-center">
                      {selectedOption ? getConditionIcon(selectedOption) : <Stethoscope className="w-4 h-4 text-gray-500" />}
                      <span className="ml-2">{selectedOption || "Select Patient Condition"}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={`w-full min-w-[400px] ${
                  theme === "light" ? "bg-white border-gray-200" : "bg-base-200 border-base-300"
                }`}>
                  <DropdownMenuLabel className={`font-semibold ${
                    theme === "light" ? "text-gray-700" : "text-base-content"
                  }`}>Select Medical Condition</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => setSelectedOption("Hemorrhage")}
                    className={`flex items-center p-3 cursor-pointer ${
                      theme === "light" ? "hover:bg-red-50" : "hover:bg-red-500/10"
                    }`}
                  >
                    <Heart className="w-4 h-4 mr-2 text-red-500" />
                    <div>
                      <div className={`font-medium ${
                        theme === "light" ? "text-gray-800" : "text-base-content"
                      }`}>Hemorrhage</div>
                      <div className={`text-xs ${
                        theme === "light" ? "text-gray-500" : "text-base-content/60"
                      }`}>Active bleeding detected</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedOption("No Hemorrhage")}
                    className={`flex items-center p-3 cursor-pointer ${
                      theme === "light" ? "hover:bg-green-50" : "hover:bg-green-500/10"
                    }`}
                  >
                    <Activity className="w-4 h-4 mr-2 text-green-500" />
                    <div>
                      <div className={`font-medium ${
                        theme === "light" ? "text-gray-800" : "text-base-content"
                      }`}>No Hemorrhage</div>
                      <div className={`text-xs ${
                        theme === "light" ? "text-gray-500" : "text-base-content/60"
                      }`}>No bleeding detected</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedOption("Large vessel occlusion")}
                    className={`flex items-center p-3 cursor-pointer ${
                      theme === "light" ? "hover:bg-blue-50" : "hover:bg-blue-500/10"
                    }`}
                  >
                    <Brain className="w-4 h-4 mr-2 text-blue-500" />
                    <div>
                      <div className={`font-medium ${
                        theme === "light" ? "text-gray-800" : "text-base-content"
                      }`}>Large Vessel Occlusion</div>
                      <div className={`text-xs ${
                        theme === "light" ? "text-gray-500" : "text-base-content/60"
                      }`}>Abrupt vessel cut-off detected</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>

            {/* Document Upload Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center mb-2">
                <Upload className={`w-4 h-4 mr-2 ${
                  theme === "light" ? "text-gray-500" : "text-base-content/70"
                }`} />
                <label className={`text-sm font-semibold uppercase tracking-wide ${
                  theme === "light" ? "text-gray-700" : "text-base-content"
                }`}>
                  Medical Document Upload
                </label>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="documentName"
                    className={`block mb-2 text-sm font-medium ${
                      theme === "light" ? "text-gray-700" : "text-base-content"
                    }`}
                  >
                    Document Name
                  </label>
                  <Input
                    id="documentName"
                    placeholder="Enter descriptive document name (e.g., CTA Brain Scan - June 2025)"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className={`${
                      theme === "light" 
                        ? "bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                        : "bg-base-100 border-base-300 focus:border-primary focus:ring-primary"
                    } transition-colors duration-200`}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFilePicker}
                  className={`flex items-center h-12 gap-2 whitespace-nowrap ${
                    theme === "light" 
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100" 
                      : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  } transition-colors duration-200`}
                >
                  <Upload className="w-4 h-4" />
                  Select File
                </Button>
              </div>

              {documentUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center p-4 border-2 border-dashed rounded-lg ${
                    theme === "light" 
                      ? "border-green-300 bg-green-50" 
                      : "border-green-500/30 bg-green-500/10"
                  }`}
                >
                  <Badge className={`px-3 py-1 mr-3 ${
                    theme === "light" 
                      ? "bg-green-100 text-green-700 hover:bg-green-200" 
                      : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  }`}>
                    <File className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                  <span className={`flex-1 text-sm font-medium truncate ${
                    theme === "light" ? "text-green-700" : "text-green-400"
                  }`}>
                    {documentName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDocumentUrl("");
                      setDocumentName("");
                    }}
                    className="w-8 h-8 p-1 text-red-500 transition-colors duration-200 rounded-full hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-500/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* Upload Instructions */}
              <div className={`p-6 text-center border-2 border-dashed rounded-lg ${
                theme === "light" 
                  ? "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50" 
                  : "border-base-300 bg-base-100 hover:border-primary hover:bg-primary/5"
              } transition-colors duration-200`}>
                <FileText className={`w-8 h-8 mx-auto mb-2 ${
                  theme === "light" ? "text-gray-400" : "text-base-content/50"
                }`} />
                <p className={`mb-1 text-sm ${
                  theme === "light" ? "text-gray-600" : "text-base-content/70"
                }`}>
                  Click "Select File" to upload medical imaging files
                </p>
                <p className={`text-xs ${
                  theme === "light" ? "text-gray-500" : "text-base-content/60"
                }`}>
                  Supported formats: PDF, DOC, CSV, PPT, TXT, XLS, Images, Videos • Max 5 files
                </p>
              </div>
            </motion.div>

            {/* Info Alert */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Alert className={`${
                theme === "light" 
                  ? "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500" 
                  : "bg-info/10 border-info/30 border-l-4 border-l-info"
              }`}>
                <Activity className={`w-4 h-4 ${
                  theme === "light" ? "text-blue-500" : "text-info"
                }`} />
                <AlertTitle className={`${
                  theme === "light" ? "text-blue-700" : "text-info"
                } font-semibold`}>
                  Medical Data Processing
                </AlertTitle>
                <AlertDescription className={`${
                  theme === "light" ? "text-blue-600" : "text-info"
                }`}>
                  Your medical imaging data will be processed using advanced AI algorithms for stroke assessment. 
                  All data is handled securely and in compliance with medical privacy standards.
                </AlertDescription>
              </Alert>
            </motion.div>
          </CardContent>

          <CardFooter className={`flex flex-col justify-between px-6 pt-4 pb-6 border-t sm:flex-row ${
            theme === "light" 
              ? "border-gray-200 bg-gray-50" 
              : "border-base-300 bg-base-300/30"
          }`}>
            <div className="flex items-center justify-between w-full space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevTab}
                className={`flex items-center w-full h-12 gap-2 sm:w-auto ${
                  theme === "light" 
                    ? "bg-white border-gray-300 hover:bg-gray-50" 
                    : "bg-base-100 border-base-300 hover:bg-base-200"
                } transition-colors duration-200`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </Button>

              <div className="flex flex-col w-full gap-4 sm:flex-row sm:w-auto">
                <form
                  onSubmit={sendDocument}
                  className="flex flex-col items-center w-full gap-2 sm:flex-row"
                >
                  <Button
                    type="submit"
                    className={`flex items-center w-full h-12 gap-2 mb-2 sm:w-auto sm:mb-0 shadow-md transition-colors duration-200 ${
                      theme === "light" 
                        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300" 
                        : "bg-primary hover:bg-primary/90 text-primary-content disabled:bg-base-300"
                    }`}
                    disabled={!documentUrl || !documentName}
                  >
                    <Send className="w-4 h-4" />
                    Send Document
                  </Button>
                  {selectedOption && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        selectCategory();
                        nextTab();
                      }}
                      className={`flex items-center w-full h-12 gap-2 sm:w-auto transition-colors duration-200 ${
                        theme === "light" 
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100" 
                          : "bg-success/10 border-success/30 text-success hover:bg-success/20"
                      }`}
                    >
                      Process Analysis
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </form>
              </div>
            </div>
          </CardFooter>
          {isPickerOverlayVisible && (
            <PickerOverlay
              apikey={import.meta.env.VITE_FILESTACK_API_KEY as string}
              onError={onError}
              onSuccess={onSuccess}
              pickerOptions={options}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default UploadComponent;