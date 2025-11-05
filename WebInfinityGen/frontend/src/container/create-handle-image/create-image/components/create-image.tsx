import { useEffect, useRef } from "react";
import {
    RootContainer,
    MessagesContainer,
    MessagesInner,
    InputContainer,
    InputWrapper,
    StyledTextarea,
    SendButton,
    WelcomeContainer,
    WelcomeTitle,
} from "../../../../components/new-chat.styled";
import { MessageList } from "../../../../components/messsage-list";
import { MyLayout } from "../../../layout/layout";
import { useCreateImage } from "../hooks/use-create-image";

export const CreateImageComponent = () => {
    const {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
    } = useCreateImage();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        if (!inputValue.trim() || isLoading) return;
        await handleSubmit();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <MyLayout>
            <RootContainer>
                {!isInputCentered && (
                    <MessagesContainer $isInputCentered={isInputCentered}>
                        <MessagesInner>
                            <MessageList
                                messages={messages}
                                isLoading={isLoading}
                                loadingText="Đang tạo ảnh..."
                            />
                            <div ref={messagesEndRef} />
                        </MessagesInner>
                    </MessagesContainer>
                )}

                <InputContainer $isInputCentered={isInputCentered}>
                    {isInputCentered && (
                        <WelcomeContainer>
                            <WelcomeTitle>Mô tả ảnh bạn muốn tạo</WelcomeTitle>
                        </WelcomeContainer>
                    )}

                    <InputWrapper>
                        <StyledTextarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập mô tả ảnh (ví dụ: Một con mèo đang ngồi trên mây)..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <SendButton
                            onClick={onSubmit}
                            disabled={!inputValue.trim() || isLoading}
                        >
                            ➤
                        </SendButton>
                    </InputWrapper>
                </InputContainer>
            </RootContainer>
        </MyLayout>
    );
};
