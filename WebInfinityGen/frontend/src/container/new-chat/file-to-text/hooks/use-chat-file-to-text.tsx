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

    // Helper: convert base64 to blob URL
    const base64ToBlobUrl = (
        base64: string,
        mime = "application/octet-stream"
    ) => {
        try {
            const binary = atob(base64);
            const len = binary.length;
            const buffer = new Uint8Array(len);
            for (let i = 0; i < len; i++) buffer[i] = binary.charCodeAt(i);
            const blob = new Blob([buffer], { type: mime });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error("base64ToBlobUrl error:", e);
            return undefined;
        }
    };

    // Call API với multipart/form-data
    const callLocalAPI = async (
        message: string,
        file?: File
    ): Promise<{ text?: string; fileUrl?: string; fileName?: string }> => {
        try {
            const form = new FormData();
            form.append("message", message || "");
            if (file) {
                form.append("file", file, file.name);
            }

            const response = await fetch(
                "http://localhost:5678/webhook-test/file-upload",
                {
                    method: "POST",
                    body: form,
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
                interface ApiChoice {
                    message?: { content?: string };
                    [key: string]: unknown;
                }
                interface ApiResponse {
                    text?: string;
                    fileBase64?: string;
                    mime?: string;
                    fileName?: string;
                    choices?: ApiChoice[];
                    output?: string;
                    [key: string]: unknown;
                }
                const r = responseData as ApiResponse;

                // Format 1: { text: "..." }
                if (typeof r.text === "string") {
                    return { text: r.text };
                }

                // Format 2: { fileBase64: "...", mime: "...", fileName: "..." }
                if (typeof r.fileBase64 === "string") {
                    const url = base64ToBlobUrl(
                        r.fileBase64,
                        typeof r.mime === "string"
                            ? r.mime
                            : "application/octet-stream"
                    );
                    return {
                        fileUrl: url,
                        fileName:
                            typeof r.fileName === "string"
                                ? r.fileName
                                : undefined,
                    };
                }

                // Format 3: OpenAI-like response
                if (Array.isArray(r.choices) && r.choices.length > 0) {
                    const firstChoice = r.choices[0];
                    if (
                        firstChoice &&
                        firstChoice.message &&
                        typeof firstChoice.message.content === "string"
                    ) {
                        return { text: firstChoice.message.content };
                    }
                }

                // Format 4: { output: "..." }
                if (typeof r.output === "string") {
                    return { text: r.output };
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
