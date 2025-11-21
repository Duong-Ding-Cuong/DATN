import { useState, useRef, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

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

const API_BASE_URL = "http://localhost:5000/api";

export const useCreateGame = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentGame, setCurrentGame] = useState<{
        html: string;
        css: string;
        javascript: string;
    } | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [pendingGameCode, setPendingGameCode] = useState<{
        html: string;
        css: string;
        javascript: string;
    } | null>(null);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [error, setError] = useState<string | null>(null);
    const isInputCentered = messages.length === 0;

    // Lấy userId từ localStorage
    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj._id) {
                    setUserId(userObj._id);
                }
            }
        } catch (error) {
            console.error("Error getting user from localStorage:", error);
        }
    }, []);

    // Load chat history nếu có chatId trong URL
    useEffect(() => {
        const chatIdFromUrl = searchParams.get("chatId");
        if (chatIdFromUrl && userId) {
            loadChatHistory(chatIdFromUrl);
        }
    }, [searchParams, userId]);

    // Lắng nghe event tạo chat mới
    useEffect(() => {
        const handleCreateNewChat = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { path } = customEvent.detail;

            if (location.pathname === path && messages.length > 0) {
                setMessages([]);
                setInputValue("");
                setCurrentGame(null);
                setChatId(null);
            }
        };

        window.addEventListener("createNewChat", handleCreateNewChat);
        return () => {
            window.removeEventListener("createNewChat", handleCreateNewChat);
        };
    }, [messages, location.pathname]);

    // Inject game code khi iframe ready
    useEffect(() => {
        if (pendingGameCode && iframeRef.current) {
            console.log("🎮 Injecting pending game code into iframe");
            setTimeout(() => {
                injectGameCode(pendingGameCode);
                setPendingGameCode(null);
            }, 300);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingGameCode]);

    // Load chat history từ database
    const loadChatHistory = async (historyId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/chat/history/${historyId}`
            );

            if (!response.ok) {
                throw new Error("Failed to load chat history");
            }

            const result = await response.json();
            if (result.success && result.data) {
                const chatData = result.data;
                setChatId(chatData.chatId);

                // Convert messages từ database
                const convertedMessages: Message[] = await Promise.all(
                    chatData.messages.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        async (msg: any, index: number) => {
                            let gameCode = undefined;

                            // Nếu message có gameUrl, load game code từ MinIO
                            if (msg.metadata?.gameUrl) {
                                try {
                                    const gameResponse = await fetch(
                                        msg.metadata.gameUrl
                                    );
                                    if (gameResponse.ok) {
                                        gameCode = await gameResponse.json();
                                        console.log(
                                            "✅ Loaded game code from MinIO:",
                                            {
                                                hasHtml: !!gameCode?.html,
                                                hasCss: !!gameCode?.css,
                                                hasJs: !!gameCode?.javascript,
                                                htmlPreview:
                                                    gameCode?.html?.substring(
                                                        0,
                                                        100
                                                    ),
                                                jsPreview:
                                                    gameCode?.javascript?.substring(
                                                        0,
                                                        100
                                                    ),
                                            }
                                        );
                                    }
                                } catch (error) {
                                    console.error(
                                        "Error loading game from MinIO:",
                                        error
                                    );
                                }
                            }

                            return {
                                id: Date.now() + index,
                                text: msg.content,
                                timestamp: new Date(
                                    msg.timestamp
                                ).toLocaleTimeString("vi-VN"),
                                isUser: msg.role === "user",
                                gameCode: gameCode,
                            };
                        }
                    )
                );

                setMessages(convertedMessages);

                // ✅ Không tự động mở game khi load lịch sử
                // Game chỉ mở khi user click "Chơi lại game này"
                console.log("✅ Chat history loaded, game ready to replay");
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Tạo chat mới trong database
    const createChatHistory = async (firstMessage: string): Promise<string> => {
        try {
            const newChatId = `chat_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;

            const response = await fetch(`${API_BASE_URL}/chat/history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chatId: newChatId,
                    userId: userId,
                    title:
                        firstMessage.substring(0, 50) +
                        (firstMessage.length > 50 ? "..." : ""),
                    chatType: "create-game",
                    firstMessage: {
                        content: firstMessage,
                        metadata: { type: "game" },
                    },
                }),
            });

            if (!response.ok) {
                console.error("Failed to create chat history");
                return newChatId;
            }

            const data = await response.json();
            console.log("Chat history created:", data);

            // Dispatch event để cập nhật danh sách lịch sử
            window.dispatchEvent(new CustomEvent("chatCreated"));

            return newChatId;
        } catch (error) {
            console.error("Error creating chat history:", error);
            return `chat_${Date.now()}`;
        }
    };

    // Thêm message vào lịch sử chat
    const addMessageToHistory = async (
        role: "user" | "assistant",
        content: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata?: Record<string, any>
    ) => {
        if (!chatId || !userId) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/chat/history/${chatId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        role,
                        content,
                        metadata: metadata || { type: "game" },
                    }),
                }
            );

            if (!response.ok) {
                console.error("Failed to add message to history");
            }
        } catch (error) {
            console.error("Error adding message to history:", error);
        }
    };

    // Upload game code as JSON to MinIO
    const uploadGameToMinIO = async (gameCode: {
        html: string;
        css: string;
        javascript: string;
    }): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/json`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonData: gameCode,
                    fileName: `game_${Date.now()}.json`,
                }),
            });

            if (!response.ok) {
                console.error("Failed to upload game to MinIO");
                return null;
            }

            const result = await response.json();
            console.log("✅ Game uploaded to MinIO:", result.data.url);
            return result.data.url;
        } catch (error) {
            console.error("Error uploading game to MinIO:", error);
            return null;
        }
    };

    // 🚀 Call n8n API để tạo game
    const callN8nAPI = async (userMessage: string): Promise<N8nResponse> => {
        try {
            const payload = {
                message: userMessage,
            };

            const response = await fetch(
                "https://n8n-production-64f1.up.railway.app/webhook-test/create-game",
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

            // 🆕 Priority 0: New format with filename/content structure
            if (responseData?.html?.content) {
                html = responseData.html.content;
                console.log("✅ Found html.content field");
            }
            if (responseData?.css?.content) {
                css = responseData.css.content;
                console.log("✅ Found css.content field");
            }
            if (responseData?.javascript?.content) {
                javascript = responseData.javascript.content;
                console.log("✅ Found javascript.content field");
            }
            if (responseData?.js?.content) {
                javascript = responseData.js.content;
                console.log("✅ Found js.content field");
            }

            // Priority 1: Direct fields
            if (
                !html &&
                responseData?.html &&
                typeof responseData.html === "string"
            ) {
                html = responseData.html;
            }
            if (
                !css &&
                responseData?.css &&
                typeof responseData.css === "string"
            ) {
                css = responseData.css;
            }
            if (
                !javascript &&
                responseData?.javascript &&
                typeof responseData.javascript === "string"
            ) {
                javascript = responseData.javascript;
            }
            if (
                !javascript &&
                responseData?.js &&
                typeof responseData.js === "string"
            ) {
                javascript = responseData.js;
            }

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

        let fullHTML: string;

        // ✅ Check if HTML already contains full document structure
        const isFullDocument =
            gameCode.html.includes("<!DOCTYPE") ||
            gameCode.html.includes("<html");

        if (isFullDocument) {
            // Case 1: gameCode.html đã là full HTML document
            console.log("📄 Using full HTML document from game code");

            // Extract and merge CSS and JS into the full document
            let htmlDoc = gameCode.html;

            // Loại bỏ external scripts/links
            htmlDoc = htmlDoc.replace(
                /<script\s+src=["'][^"']*["'][^>]*><\/script>/gi,
                ""
            );
            htmlDoc = htmlDoc.replace(
                /<link\s+[^>]*href=["'](?!data:)[^"']*["'][^>]*>/gi,
                ""
            );

            // Inject CSS vào <head> nếu có và chưa có CSS
            if (gameCode.css && gameCode.css.trim()) {
                const styleTag = `<style>${gameCode.css}</style>`;
                if (
                    htmlDoc.includes("</head>") &&
                    !htmlDoc.includes(gameCode.css.substring(0, 50))
                ) {
                    htmlDoc = htmlDoc.replace(
                        "</head>",
                        `${styleTag}\n</head>`
                    );
                }
            }

            // Inject JS vào cuối <body> nếu có và chưa có JS
            if (gameCode.javascript && gameCode.javascript.trim()) {
                // Check nếu JS chưa có trong HTML (tránh duplicate)
                const jsPreview = gameCode.javascript.substring(0, 100).trim();
                if (
                    htmlDoc.includes("</body>") &&
                    !htmlDoc.includes(jsPreview)
                ) {
                    const scriptTag = `<script>${gameCode.javascript}</script>`;
                    htmlDoc = htmlDoc.replace(
                        "</body>",
                        `${scriptTag}\n</body>`
                    );
                }
            }

            fullHTML = htmlDoc;
        } else {
            // Case 2: gameCode.html chỉ chứa body content
            console.log("📦 Wrapping body content in HTML template");

            // Loại bỏ external scripts/links từ HTML content
            let cleanHtml = gameCode.html;
            cleanHtml = cleanHtml.replace(
                /<script\s+src=["'][^"']*["'][^>]*><\/script>/gi,
                ""
            );
            cleanHtml = cleanHtml.replace(
                /<link\s+[^>]*href=["'](?!data:)[^"']*["'][^>]*>/gi,
                ""
            );

            fullHTML = `
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
        ${gameCode.css || ""}
    </style>
</head>
<body>
    ${cleanHtml}
    <script>
        ${gameCode.javascript || ""}
    </script>
</body>
</html>
            `.trim();
        }

        // ✅ Write to iframe
        iframeDoc.open();
        iframeDoc.write(fullHTML);
        iframeDoc.close();

        console.log("✅ Game injected into iframe", {
            htmlLength: fullHTML.length,
            hasScript: fullHTML.includes("<script"),
            hasStyle: fullHTML.includes("<style"),
            isFullDoc: isFullDocument,
        });

        // ✅ Focus iframe để nhận keyboard events
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
            }
        }, 100);
    };

    // 📤 Handle submit
    const handleSubmit = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessageText = inputValue.trim();

        // Nếu là tin nhắn đầu tiên, tạo chat history mới
        let currentChatId = chatId;
        if (!currentChatId && userId) {
            const newChatId = await createChatHistory(userMessageText);
            setChatId(newChatId);
            currentChatId = newChatId;
        }

        const userMessage: Message = {
            id: Date.now(),
            text: userMessageText,
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

        // Nếu không phải tin nhắn đầu tiên, lưu tin nhắn user vào history
        if (chatId) {
            await addMessageToHistory("user", userMessageText);
        }

        try {
            console.log("🚀 Creating game from message:", userMessageText);

            const response = await callN8nAPI(userMessageText);

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

            // Lưu tin nhắn AI vào history
            if (currentChatId && aiMessage.gameCode) {
                // Upload game code to MinIO
                const gameUrl = await uploadGameToMinIO(aiMessage.gameCode);

                await fetch(
                    `${API_BASE_URL}/chat/history/${currentChatId}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            role: "assistant",
                            content: aiMessage.text,
                            metadata: {
                                type: "game",
                                hasGameCode: true,
                                gameUrl: gameUrl, // Lưu URL của game code
                            },
                        }),
                    }
                );
            } else if (currentChatId) {
                // Nếu không có game code, chỉ lưu text
                await fetch(
                    `${API_BASE_URL}/chat/history/${currentChatId}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            role: "assistant",
                            content: aiMessage.text,
                            metadata: {
                                type: "game",
                                hasGameCode: false,
                            },
                        }),
                    }
                );
            }

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
        console.log("🔄 Replaying game...");
        setCurrentGame(gameCode);

        // Clear iframe trước khi inject lại
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

        // Inject lại game code
        setTimeout(() => {
            injectGameCode(gameCode);
        }, 150);
    };

    // 🔄 Reset game (đóng iframe)
    const resetGame = () => {
        console.log("❌ Closing game...");
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
