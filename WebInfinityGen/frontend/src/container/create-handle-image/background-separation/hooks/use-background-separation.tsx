import { useState } from "react";

export type ImageData = {
    originalImage: string;
    originalFile: File;
    processedImage?: string;
};

type AIResponse = {
    processedImage?: string;
    text?: string;
};

export const useBackgroundSeparation = () => {
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 📤 Convert file to base64 (raw base64, NO data URL prefix)
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Remove "data:image/...;base64," prefix
                const base64Data = base64String.split(",")[1];
                resolve(base64Data);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // 🎨 Convert base64 to image URL
    const base64ToImageUrl = (base64: string): string => {
        // Nếu đã có prefix data:image
        if (base64.startsWith("data:image/")) {
            return base64;
        }
        // Nếu là URL thông thường
        if (base64.startsWith("http://") || base64.startsWith("https://")) {
            return base64;
        }

        // Auto-detect MIME type từ base64 magic bytes
        let mimeType = "image/jpeg";
        if (base64.startsWith("/9j/")) {
            mimeType = "image/jpeg";
        } else if (base64.startsWith("iVBORw0KGgo")) {
            mimeType = "image/png";
        } else if (base64.startsWith("R0lGOD")) {
            mimeType = "image/gif";
        } else if (base64.startsWith("UklGR")) {
            mimeType = "image/webp";
        }

        return `data:${mimeType};base64,${base64}`;
    };

    // 🚀 Call n8n API
    const callN8nAPI = async (imageFile: File): Promise<AIResponse> => {
        try {
            const imageBase64 = await fileToBase64(imageFile);

            // ✅ Payload giống use-handle-image
            const payload = {
                image: imageBase64,
            };

            const response = await fetch(
                "http://localhost:5678/webhook-test/xoa-nen-anh",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ n8n API Error:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // ✅ Parse response giống use-handle-image
            let responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;

            // ===================== PARSE JSON STRING IF NEEDED =====================

            // Nếu field "output" là JSON string, parse nó
            if (
                responseData?.output &&
                typeof responseData.output === "string"
            ) {
                try {
                    const parsedOutput = JSON.parse(responseData.output);
                    console.log(
                        "✅ Parsed JSON from 'output' field:",
                        parsedOutput
                    );
                    responseData = parsedOutput;
                } catch {
                    console.log(
                        "ℹ️ 'output' is not JSON, treating as plain text"
                    );
                }
            }

            let textContent: string | undefined = undefined;
            let imageUrl: string | undefined = undefined;

            // ===================== EXTRACT TEXT & IMAGE =====================

            // Priority 1: Direct fields "text" and "image" (after JSON parse)
            if (responseData?.text && typeof responseData.text === "string") {
                console.log("✅ Found 'text' field");
                textContent = responseData.text;
            }

            if (responseData?.image && typeof responseData.image === "string") {
                console.log("✅ Found 'image' field");
                imageUrl = responseData.image;
            }

            // Priority 2: Field "processedImage"
            if (
                !imageUrl &&
                responseData?.processedImage &&
                typeof responseData.processedImage === "string"
            ) {
                console.log("✅ Found 'processedImage' field");
                imageUrl = responseData.processedImage;
            }

            // Priority 3: Field "data"
            if (
                !imageUrl &&
                responseData?.data &&
                typeof responseData.data === "string"
            ) {
                console.log("✅ Found 'data' field");
                imageUrl = responseData.data;
            }

            // Priority 4: Field "message"
            if (
                !textContent &&
                responseData?.message &&
                typeof responseData.message === "string"
            ) {
                console.log("✅ Found 'message' field");
                textContent = responseData.message;
            }

            // Priority 5: OpenAI-like format (choices[])
            if (
                !textContent &&
                !imageUrl &&
                responseData.choices &&
                Array.isArray(responseData.choices) &&
                responseData.choices.length > 0
            ) {
                const choice = responseData.choices[0];
                console.log("✅ Found OpenAI-like 'choices' format");

                if (choice.message) {
                    textContent = choice.message.content || "";

                    // Extract image từ message.images
                    if (
                        !imageUrl &&
                        Array.isArray(choice.message.images) &&
                        choice.message.images.length > 0
                    ) {
                        const firstImg = choice.message.images[0];
                        imageUrl =
                            firstImg.image_url?.url || firstImg.url || firstImg;
                        console.log(
                            "✅ Extracted image from choices[].message.images"
                        );
                    }
                }
            }

            // Priority 6: Content parts format
            if (!textContent && !imageUrl && responseData?.content?.parts) {
                const parts = responseData.content.parts;
                console.log("✅ Found 'content.parts' format");

                if (Array.isArray(parts) && parts.length > 0) {
                    for (const part of parts) {
                        // Extract text
                        if (!textContent && part.text) {
                            textContent = part.text;
                        }

                        // Extract image
                        if (!imageUrl && part.inline_data?.data) {
                            const mimeType =
                                part.inline_data.mime_type || "image/jpeg";
                            imageUrl = `data:${mimeType};base64,${part.inline_data.data}`;
                            console.log(
                                "✅ Extracted image from content.parts[].inline_data"
                            );
                        }
                    }
                }
            }

            // ===================== VALIDATION =====================

            if (!textContent && !imageUrl) {
                console.error(
                    "❌ No text or image found in response. Full data:",
                    data
                );
                console.error(
                    "📋 Available fields:",
                    Object.keys(responseData)
                );
                throw new Error("⚠️ Không nhận được ảnh đã xử lý từ n8n API.");
            }

            // ✅ Convert base64 to proper image URL
            let processedImageUrl = imageUrl;
            if (
                imageUrl &&
                !imageUrl.startsWith("data:image/") &&
                !imageUrl.startsWith("http")
            ) {
                processedImageUrl = base64ToImageUrl(imageUrl);
                console.log("✅ Converted base64 to data URL");
            }

            console.log("✅ Parsed n8n response:", {
                hasText: !!textContent,
                textPreview: textContent?.substring(0, 100),
                hasImage: !!processedImageUrl,
                imagePreview: processedImageUrl?.substring(0, 100),
            });

            return {
                processedImage: processedImageUrl,
                text: textContent || "✓ Đã tăng độ phân giải ảnh thành công.",
            };
        } catch (error) {
            console.error("💥 n8n API Error:", error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error("⚠️ Không thể xử lý ảnh. Vui lòng thử lại.");
        }
    };

    // 📥 Set Original Image
    const setOriginalImage = (file: File, preview: string) => {
        setImageData({
            originalImage: preview,
            originalFile: file,
        });
        setError(null);
        console.log("✅ Image uploaded:", {
            name: file.name,
            size: (file.size / 1024).toFixed(2) + " KB",
            type: file.type,
        });
    };

    // 🔄 Process Image
    const handleProcessImage = async () => {
        if (!imageData?.originalFile) {
            setError("Vui lòng chọn ảnh trước");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            console.log("🚀 Processing image:", imageData.originalFile.name);

            // ✅ Call n8n API thay vì OpenRouter
            const response = await callN8nAPI(imageData.originalFile);

            console.log("📦 Setting imageData:", {
                hasProcessedImage: !!response.processedImage,
                processedImageLength: response.processedImage?.length,
                processedImagePreview: response.processedImage?.substring(
                    0,
                    100
                ),
                textPreview: response.text?.substring(0, 100),
            });

            setImageData((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    processedImage: response.processedImage,
                };
            });

            console.log("✅ Image processed successfully");
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Đã xảy ra lỗi khi xử lý ảnh";
            setError(errorMessage);
            console.error("❌ Processing error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    // 🔄 Reset Images
    const resetImages = () => {
        if (imageData?.originalImage) {
            URL.revokeObjectURL(imageData.originalImage);
        }
        setImageData(null);
        setError(null);
        console.log("🔄 Reset images");
    };

    // 💾 Download Image
    const downloadImage = async (imageUrl: string, filename: string) => {
        try {
            if (imageUrl.startsWith("data:image")) {
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
            console.log("✅ Image downloaded:", filename);
        } catch (error) {
            console.error("❌ Download error:", error);
            throw error;
        }
    };

    return {
        imageData,
        isProcessing,
        error,
        setOriginalImage,
        handleProcessImage,
        resetImages,
        downloadImage,
    };
};
