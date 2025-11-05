import { useEffect, useRef } from "react";
import useNewChat from "../hooks/use-new-chat";
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

export const NewChatComponent = () => {
    const {
        messages,
        inputValue,
        setInputValue,
        isInputCentered,
        isLoading,
        handleSubmit,
    } = useNewChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

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
                            />
                            <div ref={messagesEndRef} />
                        </MessagesInner>
                    </MessagesContainer>
                )}

                <InputContainer $isInputCentered={isInputCentered}>
                    {isInputCentered && (
                        <WelcomeContainer>
                            <WelcomeTitle>
                                Hãy nhập tin nhắn để bắt đầu
                            </WelcomeTitle>
                        </WelcomeContainer>
                    )}

                    <InputWrapper>
                        <StyledTextarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn của bạn..."
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
