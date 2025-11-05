import { useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { useChatFileToText } from "../hooks/use-chat-file-to-text";
import { MyLayout } from "../../../layout/layout";
import { UploadButton } from "../../../../components/button/button";

// ============ STYLED COMPONENTS ============

const MessagesContainer = styled.div<{ $isInputCentered: boolean }>`
    top: 0;
    left: 0;
    right: 0;
    bottom: 140px;
    overflow-y: auto;
    padding: 20px;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 0 : 1)};
    transition: opacity 0.5s ease-in-out;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
        display: none;
    }
`;

const MessagesInner = styled.div`
    max-width: 768px;
    margin: 0 auto;
`;

const slideUp = keyframes`
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessageRow = styled.div<{
    $isUser: boolean;
    $index: number;
    $isLast?: boolean;
}>`
    display: flex;
    justify-content: ${({ $isUser }) => ($isUser ? "flex-end" : "flex-start")};
    margin-bottom: 16px;
    opacity: 0;
    transform: translateY(20px);
    animation: ${slideUp} 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)
        ${({ $isUser, $isLast, $index }) =>
            $isUser || $isLast ? "0s" : `${$index * 0.11}s`}
        forwards;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
    background-color: ${({ $isUser }) => ($isUser ? "black" : "#374151")};
    color: white;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-right-radius: ${({ $isUser }) => ($isUser ? "4px" : "16px")};
    border-bottom-left-radius: ${({ $isUser }) => ($isUser ? "16px" : "4px")};
    max-width: 70%;
    word-wrap: break-word;
    line-height: 28px;
    font-size: 1rem;
`;

const Timestamp = styled.p`
    margin: 4px 0 0 0;
    font-size: 12px;
    opacity: 0.75;
    color: #9ca3af;
`;

const FileLink = styled.a`
    display: inline-block;
    margin-top: 8px;
    padding: 8px 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #60a5fa;
    text-decoration: none;
    font-size: 14px;
    &:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;

const LoadingRow = styled.div`
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
`;

const LoadingBubble = styled.div`
    background-color: #374151;
    color: white;
    padding: 12px 16px;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    max-width: 70%;
`;

const LoadingDots = styled.div`
    display: flex;
    gap: 4px;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const LoadingDot = styled.div<{ delay?: string }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #9ca3af;
    animation: ${bounce} 1.4s infinite ease-in-out both;
    ${({ delay }) =>
        delay &&
        css`
            animation-delay: ${delay};
        `}
`;

const InputContainer = styled.div<{ $isInputCentered: boolean }>`
    position: absolute;
    left: 50%;
    width: 100%;
    max-width: 768px;
    padding: 0 24px;
    transform: translateX(-50%)
        translateY(
            ${({ $isInputCentered }) => ($isInputCentered ? "-50%" : "0")}
        );
    top: ${({ $isInputCentered }) => ($isInputCentered ? "50%" : "auto")};
    bottom: ${({ $isInputCentered }) => ($isInputCentered ? "auto" : "20px")};
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
`;

const WelcomeMessage = styled.div<{ $isInputCentered: boolean }>`
    text-align: center;
    margin-bottom: 32px;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 1 : 0)};
    transform: translateY(
        ${({ $isInputCentered }) => ($isInputCentered ? "0" : "-20px")}
    );
    transition: all 0.5s ease-in-out;
    pointer-events: ${({ $isInputCentered }) =>
        $isInputCentered ? "auto" : "none"};
    color: white;
    font-size: 32px;
    font-weight: 600;
`;

const InputForm = styled.div<{ $isInputCentered: boolean }>`
    display: flex;
    align-items: flex-end;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 16px;
    box-shadow: ${({ $isInputCentered }) =>
        $isInputCentered
            ? "0 10px 25px rgba(0,0,0,0.3)"
            : "0 4px 12px rgba(0,0,0,0.2)"};
    transition: box-shadow 0.3s ease;
    position: relative;
`;

const SelectedFileTag = styled.div`
    position: absolute;
    bottom: 100%;
    left: 8px;
    margin-bottom: 8px;
    padding: 6px 12px;
    background-color: #374151;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const RemoveFileButton = styled.button`
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0;
    font-size: 18px;
    line-height: 1;
    &:hover {
        color: #dc2626;
    }
`;

const StyledTextarea = styled.textarea<{ $isLoading: boolean }>`
    flex: 1;
    padding: 12px 16px;
    background-color: transparent;
    border: none;
    outline: none;
    resize: none;
    color: ${({ $isLoading }) => ($isLoading ? "#9ca3af" : "white")};
    font-size: 16px;
    font-family: ui-sans-serif, -apple-system, system-ui, Segoe UI, Helvetica,
        Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
    max-height: 120px;
    min-height: 48px;
    scrollbar-width: none;
`;

const SendButton = styled.button<{ $active: boolean }>`
    margin: 8px;
    padding: 8px;
    border-radius: 50%;
    border: none;
    background-color: ${({ $active }) => ($active ? "#c6613f" : "#6b7280")};
    color: white;
    cursor: ${({ $active }) => ($active ? "pointer" : "not-allowed")};
    transition: all 0.2s ease;
    transform: ${({ $active }) => ($active ? "scale(1)" : "scale(0.9)")};
    opacity: ${({ $active }) => ($active ? 1 : 0.6)};
    &:hover {
        background-color: ${({ $active }) => ($active ? "#d97757" : "#6b7280")};
        transform: ${({ $active }) => ($active ? "scale(1.05)" : "scale(0.9)")};
    }
`;

const HintText = styled.p<{ $isInputCentered: boolean }>`
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
    margin: 8px 0 0 0;
    opacity: ${({ $isInputCentered }) => ($isInputCentered ? 1 : 0.7)};
    transition: opacity 0.3s ease;
`;

// ============ COMPONENT ============
export default function ChatFileToText() {
    const {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
        selectedFile,
        setSelectedFile,
    } = useChatFileToText();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const onSend = async () => {
        await handleSubmit();
        // clear native file input so selecting the same file again triggers change
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void onSend();
        }
    };

    const handleFileSelect = (file: File) => {
        setSelectedFile({ file, name: file.name });
    };

    const isActive =
        (inputValue.trim() !== "" || selectedFile !== null) && !isLoading;

    return (
        <MyLayout>
            <MessagesContainer $isInputCentered={isInputCentered}>
                <MessagesInner>
                    {messages.map((msg, idx) => (
                        <MessageRow
                            key={msg.id}
                            $isUser={msg.isUser}
                            $index={idx}
                            $isLast={idx === messages.length - 1}
                        >
                            <div>
                                <MessageBubble $isUser={msg.isUser}>
                                    {msg.text}
                                    {msg.fileUrl && msg.fileName && (
                                        <FileLink
                                            href={msg.fileUrl}
                                            download={msg.fileName}
                                        >
                                            📥 Tải xuống: {msg.fileName}
                                        </FileLink>
                                    )}
                                </MessageBubble>
                                <Timestamp>{msg.timestamp}</Timestamp>
                            </div>
                        </MessageRow>
                    ))}
                    {isLoading && (
                        <LoadingRow>
                            <LoadingBubble>
                                <LoadingDots>
                                    <LoadingDot delay="-0.32s" />
                                    <LoadingDot delay="-0.16s" />
                                    <LoadingDot />
                                </LoadingDots>
                            </LoadingBubble>
                        </LoadingRow>
                    )}
                    <div ref={messagesEndRef} />
                </MessagesInner>
            </MessagesContainer>

            <InputContainer $isInputCentered={isInputCentered}>
                <WelcomeMessage $isInputCentered={isInputCentered}>
                    Gửi file và tin nhắn của bạn
                </WelcomeMessage>

                <InputForm $isInputCentered={isInputCentered}>
                    {selectedFile && (
                        <SelectedFileTag>
                            📎 {selectedFile.name}
                            <RemoveFileButton
                                onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current)
                                        fileInputRef.current.value = "";
                                }}
                            >
                                ×
                            </RemoveFileButton>
                        </SelectedFileTag>
                    )}

                    <UploadButton
                        onFileSelect={handleFileSelect}
                        disabled={isLoading}
                    />

                    <StyledTextarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isLoading ? "Đang xử lý..." : "Nhập tin nhắn..."
                        }
                        disabled={isLoading}
                        $isLoading={isLoading}
                    />

                    <SendButton
                        $active={isActive}
                        onClick={onSend}
                        disabled={!isActive}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </SendButton>
                </InputForm>

                <HintText $isInputCentered={isInputCentered}>
                    Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </HintText>
            </InputContainer>
        </MyLayout>
    );
}
