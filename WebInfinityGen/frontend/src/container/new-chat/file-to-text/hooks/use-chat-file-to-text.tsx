import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    fileUrl?: string;
    fileName?: string;
};

type SelectedFile = {
    file: File;
    name: string;
};

export const useChatFileToText = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isInputCentered, setIsInputCentered] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const location = useLocation();

    // Lắng nghe event tạo chat mới
    useEffect(() => {
        const handleCreateNewChat = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { path } = customEvent.detail;

            if (location.pathname === path && messages.length > 0) {
                setMessages([]);
                setInputValue("");
                setIsInputCentered(true);
                setSelectedFile(null);
            }
        };

        window.addEventListener("createNewChat", handleCreateNewChat);
        return () => {
            window.removeEventListener("createNewChat", handleCreateNewChat);
        };
    }, [messages, location.pathname]);

    // Helper: convert File to base64 with data URL header
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    // Giữ nguyên cả data URL header: "data:image/png;base64,..."
                    resolve(reader.result);
                } else {
                    reject(new Error("Failed to read file"));
                }
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Call API với JSON body chứa base64
    const callLocalAPI = async (
        message: string,
        file?: File
    ): Promise<{ text?: string; fileUrl?: string; fileName?: string }> => {
        try {
            let fileBase64: string | undefined;
            let fileName: string | undefined;
            let mimeType: string | undefined;

            if (file) {
                fileBase64 = await fileToBase64(file);
                fileName = file.name;
                mimeType = file.type;
            }

            const response = await fetch(
                "http://localhost:5678/webhook-test/handle-file",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: message || "",
                        file: fileBase64,
                        fileName: fileName,
                        mimeType: mimeType,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type") || "";

            // Nếu server trả về file binary
            if (!contentType.includes("application/json")) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const disposition =
                    response.headers.get("content-disposition") || "";
                let filename = "result";
                const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
                    disposition
                );
                if (match && match[1]) {
                    filename = match[1].replace(/['"]/g, "");
                }
                return { fileUrl: url, fileName: filename };
            }

            // Nếu server trả về JSON
            const data = await response.json();
            const responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;

            // Xử lý các định dạng JSON khác nhau
            if (responseData && typeof responseData === "object") {
                interface ApiResponse {
                    text?: string;
                    content?: {
                        parts?: Array<{ text?: string }>;
                        role?: string;
                    };
                    [key: string]: unknown;
                }
                const r = responseData as ApiResponse;

                // Format 1: { content: { parts: [{ text }] } } - Gemini/n8n format
                if (r.content?.parts && Array.isArray(r.content.parts)) {
                    const allTexts = r.content.parts
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .filter((part: any) => part?.text)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((part: any) => part.text)
                        .join("");

                    if (allTexts) return { text: allTexts };
                }

                // Format 2: { text: "..." }
                if (typeof r.text === "string") {
                    return { text: r.text };
                }
            }

            // Fallback: stringify JSON
            return { text: JSON.stringify(data, null, 2) };
        } catch (error) {
            console.error("callLocalAPI error:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Không thể kết nối với API"
            );
        }
    };

    const handleSubmit = async () => {
        if (!inputValue.trim() && !selectedFile) return;
        if (isLoading) return;

        const userMessage = inputValue.trim();
        const hasFile = Boolean(selectedFile);

        // Tạo message của user
        const userMessageObj: Message = {
            id: Date.now(),
            text: userMessage || (hasFile ? `📎 ${selectedFile?.name}` : ""),
            timestamp: new Date().toLocaleTimeString("vi-VN"),
            isUser: true,
            fileName: hasFile ? selectedFile!.name : undefined,
        };

        setMessages((prev) => [...prev, userMessageObj]);
        setIsInputCentered(false);

        // Clear input
        const fileToSend = selectedFile?.file;
        setInputValue("");
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const aiResponse = await callLocalAPI(
                userMessage || "",
                fileToSend
            );

            const aiMessage: Message = {
                id: Date.now() + 1,
                text: aiResponse.text || "✓ File đã được xử lý",
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
                fileUrl: aiResponse.fileUrl,
                fileName: aiResponse.fileName,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            const errMsg: Message = {
                id: Date.now() + 1,
                text: `⚠️ Lỗi: ${
                    err instanceof Error ? err.message : "Không xác định"
                }`,
                timestamp: new Date().toLocaleTimeString("vi-VN"),
                isUser: false,
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
        selectedFile,
        setSelectedFile,
        setMessages,
    };
};
