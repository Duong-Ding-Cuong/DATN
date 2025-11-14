import { MyLayout } from "../../../layout/layout";
import {
    RootContainer,
    WelcomeContainer,
    WelcomeTitle,
} from "../../../../components/new-chat.styled";
import { UploadImageButton } from "../../../../components/button/btn-handle-image";
import { ImageProcessingChat } from "../../../../components/image-frame";
import { useIncreaseImageResolution } from "../hooks/use-increase-image-resolution";
import styled from "styled-components";

export const IncreaseImageResolutionComponent = () => {
    const {
        imageData,
        isProcessing,
        error,
        setOriginalImage,
        handleProcessImage,
        downloadImage,
        resetImages,
    } = useIncreaseImageResolution();

    const handleImageSelect = (file: File, preview: string) => {
        setOriginalImage(file, preview);
    };

    const handleReset = () => {
        resetImages();
    };

    return (
        <MyLayout>
            <RootContainer>
                <WelcomeContainer>
                    <WelcomeTitle>Làm nét ảnh</WelcomeTitle>
                </WelcomeContainer>

                {!imageData ? (
                    <UploadSection>
                        <UploadImageButton
                            onImageSelect={handleImageSelect}
                            buttonText="Chọn ảnh để bắt đầu"
                            showFileName={true}
                        />
                    </UploadSection>
                ) : (
                    <ContentSection>
                        <ImageProcessingChat
                            originalImage={imageData.originalImage}
                            processedImage={imageData.processedImage}
                            isProcessing={isProcessing}
                            error={error}
                            onProcess={handleProcessImage}
                            originalFile={imageData.originalFile}
                            onDownload={downloadImage}
                        />

                        <ResetButton onClick={handleReset}>
                            🔄 Chọn ảnh mới
                        </ResetButton>
                    </ContentSection>
                )}
            </RootContainer>
        </MyLayout>
    );
};

// Styled Components
const UploadSection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
`;

const ContentSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
`;

const ResetButton = styled.button`
    align-self: center;
    min-width: 200px;
    height: 45px;
    padding: 0 25px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.05);
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.02);
    }

    &:active {
        transform: scale(0.98);
    }
`;
