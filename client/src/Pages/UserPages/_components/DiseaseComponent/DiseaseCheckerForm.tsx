"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useThemeStore } from "@/store/themeStore";
import { toast } from "react-hot-toast";
import { Activity, AlertCircle, ClipboardList, Stethoscope } from "lucide-react";
import CloudinaryUpload from "./Cloud";
import ReactMarkdown from "react-markdown";

const DiseaseCheckerForm = () => {
  const [formData, setFormData] = useState({
    currentSymptoms: "",
    previousDiseases: "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useThemeStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentSymptoms || !formData.previousDiseases || !imageUrl) {
      toast.error("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    setLlmResponse("");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GEMMA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it:free",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `Symptoms: ${formData.currentSymptoms}` },
                { type: "text", text: `History: ${formData.previousDiseases}` },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) {
        setLlmResponse(reply);
      } else {
        toast.error("No response from LLM.");
      }
    } catch (error) {
      console.error(error);
      toast.error("LLM request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`${theme === "light" ? "bg-white border-gray-200" : "bg-base-200/50"} shadow-sm`}>
      <CardHeader className={`${theme === "light" ? "bg-gray-50" : "bg-base-300/30"}`}>
        <CardTitle className={`${theme === "light" ? "text-gray-800" : "text-primary"}`}>
          <Activity className="w-5 h-5 mr-2 inline" />
          Health Assessment Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">
              <Stethoscope className="inline w-4 h-4 mr-1" />
              Current Symptoms
            </label>
            <Textarea
              name="currentSymptoms"
              value={formData.currentSymptoms}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              <ClipboardList className="inline w-4 h-4 mr-1" />
              Medical History
            </label>
            <Textarea
              name="previousDiseases"
              value={formData.previousDiseases}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Upload Related Image</label>
            <CloudinaryUpload onUpload={setImageUrl} />
            {imageUrl && <img src={imageUrl} alt="Uploaded" className="w-32 mt-2 rounded" />}
          </div>
          <Alert>
            <AlertCircle className="w-4 h-4 mr-1 inline" />
            <AlertTitle className="font-semibold">Note</AlertTitle>
            <AlertDescription>This is informational only.</AlertDescription>
          </Alert>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.currentSymptoms || !formData.previousDiseases || !imageUrl}
          >
            {isSubmitting ? "Processing..." : "Submit Health Assessment"}
          </Button>
        </form>
        {llmResponse && (
          <div className="mt-6 prose max-w-full">
            <ReactMarkdown>{llmResponse}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiseaseCheckerForm;
