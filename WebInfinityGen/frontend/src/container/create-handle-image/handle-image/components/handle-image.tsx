import React, { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Plus, X, Image as ImageIcon } from "lucide-react";
import { MyLayout } from "../../../layout/layout";
import useHandleImage from "../hooks/use-handle-image";
import {
    RootContainer,
    DragOverlay,
    DragText,
    MessagesContainer,
    MessagesInner,
    MessageRow,
    MessageBubble,
    Timestamp,
    LoadingRow,
    LoadingBubble,
    LoadingDots,
    LoadingDot,
    LoadingText,
    InputContainer,
    WelcomeMessage,
    ImagePreviewBox,
    ImagePreviewRow,
    ImagePreview,
    ImagePreviewInfo,
    ImagePreviewName,
    ImagePreviewDesc,
    RemoveImageButton,
    InputForm,
    FileButton,
    StyledTextarea,
    SendButton,
    HintText,
} from "./style";

export const NewChatComponent = () => {
    const {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
        selectedImage,
        setSelectedImage,
    } = useHandleImage();

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    // Ref for auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Auto scroll to bottom when messages or loading changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    // Gửi tin nhắn (text, image hoặc cả hai) chỉ qua handleSubmit của hook
    const onSubmit = async (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        await handleSubmit();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage({
                    file: file,
                    preview: e.target?.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find((file) => file.type.startsWith("image/"));

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage({
                    file: imageFile,
                    preview: event.target?.result as string,
                });
            };
            reader.readAsDataURL(imageFile);
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <MyLayout
            styles={{ padding: 0, background: "#212121", overflow: "hidden" }}
        >
            <RootContainer
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <DragOverlay>
                        <ImageIcon size={48} color="#2563eb" />
                        <DragText>Thả ảnh vào đây để upload</DragText>
                    </DragOverlay>
                )}

                {messages.length > 0 && (
                    <MessagesContainer
                        $isInputCentered={isInputCentered}
                        className="messages-container"
                    >
                        <MessagesInner>
                            {messages.map((message, index) => {
                                // Luôn hiển thị nếu có image hoặc text
                                const isLast = index === messages.length - 1;
                                return (
                                    <MessageRow
                                        key={message.id}
                                        $isUser={message.isUser}
                                        $index={index}
                                        $isLast={isLast}
                                    >
                                        <MessageBubble $isUser={message.isUser}>
                                            {message.image && (
                                                <img
                                                    src={message.image}
                                                    alt="Uploaded"
                                                    style={{
                                                        maxWidth: "300px",
                                                        maxHeight: "300px",
                                                        borderRadius: "8px",
                                                        marginBottom:
                                                            message.text
                                                                ? "8px"
                                                                : "0",
                                                    }}
                                                />
                                            )}
                                            {message.text && (
                                                <ReactMarkdown
                                                    children={message.text}
                                                    components={{
                                                        p: (props) => (
                                                            <p
                                                                style={{
                                                                    margin: 0,
                                                                    fontSize:
                                                                        "14px",
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                }}
                                                                {...props}
                                                            />
                                                        ),
                                                        strong: (props) => (
                                                            <strong
                                                                style={{
                                                                    fontWeight:
                                                                        "bold",
                                                                }}
                                                                {...props}
                                                            />
                                                        ),
                                                        em: (props) => (
                                                            <em
                                                                style={{
                                                                    fontStyle:
                                                                        "italic",
                                                                }}
                                                                {...props}
                                                            />
                                                        ),
                                                        u: (props) => (
                                                            <u
                                                                style={{
                                                                    textDecoration:
                                                                        "underline",
                                                                }}
                                                                {...props}
                                                            />
                                                        ),
                                                        code: (props) => (
                                                            <code
                                                                style={{
                                                                    backgroundColor:
                                                                        "#2d2d2d",
                                                                    padding:
                                                                        "2px 4px",
                                                                    borderRadius:
                                                                        "4px",
                                                                    fontFamily:
                                                                        "monospace",
                                                                }}
                                                                {...props}
                                                            />
                                                        ),
                                                    }}
                                                />
                                            )}
                                            <Timestamp>
                                                {message.timestamp}
                                            </Timestamp>
                                        </MessageBubble>
                                    </MessageRow>
                                );
                            })}
                            {isLoading && (
                                <LoadingRow>
                                    <LoadingBubble>
                                        <LoadingDots>
                                            <LoadingDot delay="-0.32s" />
                                            <LoadingDot delay="-0.16s" />
                                            <LoadingDot />
                                        </LoadingDots>
                                        <LoadingText>
                                            {selectedImage
                                                ? "N8N đang phân tích ảnh..."
                                                : "AI suy nghĩ và đang trả lời..."}
                                        </LoadingText>
                                    </LoadingBubble>
                                </LoadingRow>
                            )}
                            {/* Auto-scroll anchor */}
                            <div ref={messagesEndRef} />
                        </MessagesInner>
                    </MessagesContainer>
                )}

                <InputContainer $isInputCentered={isInputCentered}>
                    <WelcomeMessage $isInputCentered={isInputCentered}>
                        <h2
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                color: "white",
                                margin: "0 0 16px 0",
                            }}
                        >
                            Xin chào!
                        </h2>
                        <p
                            style={{
                                fontSize: "18px",
                                color: "#d1d5db",
                                margin: 0,
                            }}
                        >
                            Hãy nhập tin nhắn hoặc upload ảnh để bắt đầu
                        </p>
                    </WelcomeMessage>

                    {selectedImage && (
                        <ImagePreviewBox>
                            <ImagePreviewRow>
                                <ImagePreview
                                    src={selectedImage.preview}
                                    alt="Preview"
                                />
                                <ImagePreviewInfo>
                                    <ImagePreviewName>
                                        {selectedImage.file.name}
                                    </ImagePreviewName>
                                    <ImagePreviewDesc>
                                        Sẵn sàng gửi đến AI
                                    </ImagePreviewDesc>
                                </ImagePreviewInfo>
                                <RemoveImageButton
                                    onClick={removeSelectedImage}
                                >
                                    <X size={16} />
                                </RemoveImageButton>
                            </ImagePreviewRow>
                        </ImagePreviewBox>
                    )}

                    <InputForm $isInputCentered={isInputCentered}>
                        <FileButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <Plus size={18} />
                        </FileButton>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                        />

                        <StyledTextarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={
                                isLoading
                                    ? "Đang xử lý..."
                                    : selectedImage
                                    ? "Mô tả về ảnh này (tùy chọn)..."
                                    : "Nhập tin nhắn hoặc chọn ảnh..."
                            }
                            disabled={isLoading}
                            $isLoading={isLoading}
                            rows={1}
                        />
                        <SendButton
                            onClick={onSubmit}
                            disabled={
                                (!inputValue.trim() && !selectedImage) ||
                                isLoading
                            }
                            $active={
                                (!!inputValue.trim() || !!selectedImage) &&
                                !isLoading
                            }
                        >
                            <Send size={18} />
                        </SendButton>
                    </InputForm>

                    <HintText $isInputCentered={isInputCentered}>
                        {isLoading
                            ? selectedImage
                                ? "Đang cho AI xử lý hình ảnh..."
                                : "AI đang trả lời..."
                            : "Nhấn Enter để gửi, kéo thả ảnh hoặc nhấn + để chọn file"}
                    </HintText>
                </InputContainer>

                {/* Keyframes and scrollbar hidden are now in styled-components */}
            </RootContainer>
        </MyLayout>
    );
};
