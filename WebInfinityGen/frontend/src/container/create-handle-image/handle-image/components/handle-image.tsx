import React, { useRef, useState, useEffect } from "react";
import { Plus, X, ImageIcon } from "lucide-react";
import { MyLayout } from "../../../layout/layout";
import useHandleImage from "../hooks/use-handle-image";
import {
    RootContainer,
    MessagesContainer,
    MessagesInner,
    InputContainer,
    InputWrapper,
    SendButton,
    WelcomeContainer,
    WelcomeTitle,
} from "../../../../components/new-chat.styled";
import { MessageList } from "../../../../components/messsage-list";
import styled from "styled-components";

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

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const onSubmit = async () => {
        if ((!inputValue.trim() && !selectedImage) || isLoading) return;
        await handleSubmit();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
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
        <MyLayout>
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

                {!isInputCentered && (
                    <MessagesContainer $isInputCentered={isInputCentered}>
                        <MessagesInner>
                            <MessageList
                                messages={messages}
                                isLoading={isLoading}
                                loadingText={
                                    selectedImage
                                        ? "Đang phân tích ảnh..."
                                        : "AI đang trả lời..."
                                }
                            />
                            <div ref={messagesEndRef} />
                        </MessagesInner>
                    </MessagesContainer>
                )}

                <InputContainer $isInputCentered={isInputCentered}>
                    {isInputCentered && (
                        <WelcomeContainer>
                            <WelcomeTitle>Xin chào!</WelcomeTitle>
                            <WelcomeSubtitle>
                                Hãy nhập tin nhắn hoặc upload ảnh để bắt đầu
                            </WelcomeSubtitle>
                        </WelcomeContainer>
                    )}

                    {selectedImage && (
                        <ImagePreviewBox>
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
                            <RemoveImageButton onClick={removeSelectedImage}>
                                <X size={16} />
                            </RemoveImageButton>
                        </ImagePreviewBox>
                    )}

                    <InputWrapper>
                        <FileButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            title="Chọn ảnh"
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
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                isLoading
                                    ? "Đang xử lý..."
                                    : selectedImage
                                    ? "Mô tả về ảnh này (tùy chọn)..."
                                    : "Nhập tin nhắn hoặc chọn ảnh..."
                            }
                            rows={1}
                            disabled={isLoading}
                        />

                        <SendButton
                            onClick={onSubmit}
                            disabled={
                                (!inputValue.trim() && !selectedImage) ||
                                isLoading
                            }
                        >
                            ➤
                        </SendButton>
                    </InputWrapper>

                    <HintText>
                        {isLoading
                            ? selectedImage
                                ? "Đang cho AI xử lý hình ảnh..."
                                : "AI đang trả lời..."
                            : "Nhấn Enter để gửi, kéo thả ảnh hoặc nhấn + để chọn file"}
                    </HintText>
                </InputContainer>
            </RootContainer>
        </MyLayout>
    );
};

// Styled Components
const DragOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(37, 99, 235, 0.1);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 1000;
`;

const DragText = styled.p`
    font-size: 18px;
    color: #2563eb;
    font-weight: 600;
`;

const WelcomeSubtitle = styled.p`
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    margin: 8px 0 0 0;
`;

const ImagePreviewBox = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 12px;
`;

const ImagePreview = styled.img`
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.1);
`;

const ImagePreviewInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const ImagePreviewName = styled.span`
    font-size: 14px;
    color: #fff;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ImagePreviewDesc = styled.span`
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
`;

const RemoveImageButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 0, 0, 0.2);
    }
`;

const FileButton = styled.button`
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const StyledTextarea = styled.textarea`
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 15px;
    resize: none;
    outline: none;
    font-family: inherit;
    line-height: 1.5;
    max-height: 200px;
    overflow-y: auto;

    &::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const HintText = styled.p`
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    margin: 8px 0 0 0;
`;
