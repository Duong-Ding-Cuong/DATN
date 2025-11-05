import { useState, useRef } from "react";

export type Message = {
    id: number;
    text: string;
    timestamp: string;
    isUser: boolean;
    gameCode?: {
        html: string;
        css: string;
        javascript: string;
    };
};

type N8nResponse = {
    html?: string;
    css?: string;
    javascript?: string;
    message?: string;
    text?: string;
};

export const useCreateGame = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentGame, setCurrentGame] = useState<{
        html: string;
        css: string;
        javascript: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isInputCentered = messages.length === 0;
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 🚀 Call n8n API để tạo game
    const callN8nAPI = async (userMessage: string): Promise<N8nResponse> => {
        try {
            const payload = {
                message: userMessage,
            };

            const response = await fetch(
                "http://localhost:5678/webhook-test/create-game",
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
            console.log("📥 Raw n8n API response:", data);

            // ✅ Parse response
            let responseData =
                Array.isArray(data) && data.length > 0 ? data[0] : data;

            // 🆕 Parse Gemini response format: content.parts[0].text
            if (responseData?.content?.parts?.[0]?.text) {
                try {
                    const textContent = responseData.content.parts[0].text;
                    console.log(
                        "📝 Parsing from content.parts[0].text:",
                        textContent.substring(0, 200)
                    );
                    const parsedContent = JSON.parse(textContent);
                    console.log("✅ Parsed Gemini format:", parsedContent);
                    responseData = parsedContent;
                } catch (e) {
                    console.log(
                        "⚠️ Failed to parse content.parts[0].text as JSON:",
                        e
                    );
                }
            }

            // Parse JSON string if needed (for other formats)
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
                    console.log("ℹ️ 'output' is not JSON");
                }
            }

            let html = "";
            let css = "";
            let javascript = "";
            let messageText = "";

            // ===================== EXTRACT HTML/CSS/JS =====================

            // Priority 1: Direct fields
            if (responseData?.html) html = responseData.html;
            if (responseData?.css) css = responseData.css;
            if (responseData?.javascript) javascript = responseData.javascript;
            if (responseData?.js) javascript = responseData.js; // Alternative field name

            // Priority 2: Code blocks in text/message
            const textContent =
                responseData?.text || responseData?.message || "";

            if (textContent && (!html || !css || !javascript)) {
                // Extract HTML
                const htmlMatch = textContent.match(/```html\n([\s\S]*?)```/i);
                if (htmlMatch && htmlMatch[1]) {
                    html = htmlMatch[1].trim();
                }

                // Extract CSS
                const cssMatch = textContent.match(/```css\n([\s\S]*?)```/i);
                if (cssMatch && cssMatch[1]) {
                    css = cssMatch[1].trim();
                }

                // Extract JavaScript
                const jsMatch = textContent.match(
                    /```(?:javascript|js)\n([\s\S]*?)```/i
                );
                if (jsMatch && jsMatch[1]) {
                    javascript = jsMatch[1].trim();
                }

                // Remove code blocks from message text
                messageText = textContent
                    .replace(/```html\n[\s\S]*?```/gi, "")
                    .replace(/```css\n[\s\S]*?```/gi, "")
                    .replace(/```(?:javascript|js)\n[\s\S]*?```/gi, "")
                    .trim();
            } else {
                messageText = textContent;
            }

            console.log("✅ Parsed game code:", {
                hasHTML: !!html,
                htmlLength: html.length,
                hasCSS: !!css,
                cssLength: css.length,
                hasJS: !!javascript,
                jsLength: javascript.length,
                messageText: messageText.substring(0, 100),
            });

            return {
                html,
                css,
                javascript,
                message: messageText || "Game đã được tạo thành công!",
            };
        } catch (error) {
            console.error("💥 n8n API Error:", error);

            if (error instanceof Error) {
                throw error;
            }

            throw new Error("⚠️ Không thể tạo game. Vui lòng thử lại.");
        }
    };

    // 🎮 Inject game code vào iframe
    const injectGameCode = (gameCode: {
        html: string;
        css: string;
        javascript: string;
    }) => {
        if (!iframeRef.current) return;

        const iframe = iframeRef.current;
        const iframeDoc =
            iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) {
            console.error("❌ Cannot access iframe document");
            return;
        }

        // ✅ Tạo HTML hoàn chỉnh với CSS và JS
        const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        ${gameCode.css}
    </style>
</head>
<body>
    ${gameCode.html}
    <script>
        ${gameCode.javascript}
    </script>
</body>
</html>
        `.trim();

        // ✅ Write to iframe
        iframeDoc.open();
        iframeDoc.write(fullHTML);
        iframeDoc.close();

        console.log("✅ Game injected into iframe");
    };

    // 📤 Handle submit
    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            timestamp: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isUser: true,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);
        setError(null);

        try {
            console.log("🚀 Creating game from message:", inputValue);

            const response = await callN8nAPI(inputValue);

            // ✅ Add AI response message
            const aiMessage: Message = {
                id: Date.now() + 1,
                text: response.message || "Game đã được tạo!",
                timestamp: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isUser: false,
                gameCode:
                    response.html || response.css || response.javascript
                        ? {
                              html: response.html || "",
                              css: response.css || "",
                              javascript: response.javascript || "",
                          }
                        : undefined,
            };

            setMessages((prev) => [...prev, aiMessage]);

            // ✅ Set current game và inject vào iframe
            if (aiMessage.gameCode) {
                setCurrentGame(aiMessage.gameCode);
                setTimeout(() => {
                    injectGameCode(aiMessage.gameCode!);
                }, 100);
            }

            console.log("✅ Game created successfully");
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Đã xảy ra lỗi khi tạo game";
            setError(errorMessage);

            const errorMsg: Message = {
                id: Date.now() + 1,
                text: `❌ Lỗi: ${errorMessage}`,
                timestamp: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isUser: false,
            };

            setMessages((prev) => [...prev, errorMsg]);
            console.error("❌ Create game error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // 🔄 Replay game từ message cũ
    const replayGame = (gameCode: {
        html: string;
        css: string;
        javascript: string;
    }) => {
        setCurrentGame(gameCode);
        setTimeout(() => {
            injectGameCode(gameCode);
        }, 100);
    };

    // 🔄 Reset game
    const resetGame = () => {
        setCurrentGame(null);
        if (iframeRef.current) {
            const iframeDoc =
                iframeRef.current.contentDocument ||
                iframeRef.current.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write("");
                iframeDoc.close();
            }
        }
    };

    return {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        currentGame,
        error,
        iframeRef,
        handleSubmit,
        replayGame,
        resetGame,
    };
};
