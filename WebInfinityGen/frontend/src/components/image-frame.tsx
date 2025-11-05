import styled from "styled-components";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";

type ImageProcessingChatProps = {
    originalImage: string;
    processedImage?: string; // ✅ Nhận từ hook
    isProcessing?: boolean; // ✅ Nhận từ hook
    error?: string | null; // ✅ Nhận từ hook
    onProcess: () => void; // ✅ Chỉ trigger, không trả về gì
    originalFile?: File;
    processedImageSize?: number; // 🆕 Size of processed image in bytes
    onDownload?: (imageUrl: string, fileName: string) => void; // ✅ Optional download handler
};

export const ImageProcessingChat = ({
    originalImage,
    processedImage,
    isProcessing = false,
    error,
    onProcess,
    originalFile,
    processedImageSize,
    onDownload,
}: ImageProcessingChatProps) => {
    const handleDownload = async (imageUrl: string, fileName: string) => {
        // Ưu tiên dùng onDownload từ props (từ hook)
        if (onDownload) {
            onDownload(imageUrl, fileName);
            return;
        }

        // Fallback: Tự download
        try {
            if (imageUrl.startsWith("data:image")) {
                // Data URL - Tải trực tiếp
                const link = document.createElement("a");
                link.href = imageUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // HTTP URL - Fetch rồi tải
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error("Download error:", err);
            alert("Không thể tải ảnh. Vui lòng thử lại!");
        }
    };

    return (
        <ChatContainer>
            <ImagesWrapper>
                {/* Ảnh gốc - Bên trái */}
                <ImageSection>
                    <SectionTitle>Ảnh gốc</SectionTitle>
                    <ImageCard>
                        <Image src={originalImage} alt="Original" />
                        <ImageInfo>
                            {originalFile && (
                                <>
                                    <InfoText>{originalFile.name}</InfoText>
                                    <InfoText>
                                        {(originalFile.size / 1024).toFixed(2)}{" "}
                                        KB
                                    </InfoText>
                                </>
                            )}
                        </ImageInfo>
                    </ImageCard>
                </ImageSection>

                {/* Ảnh đã xử lý - Bên phải */}
                <ImageSection>
                    <SectionTitle>Ảnh đã xử lý</SectionTitle>
                    <ImageCard>
                        {!processedImage && !isProcessing && (
                            <PlaceholderText>
                                Nhấn nút "Xử lý ảnh" để bắt đầu
                            </PlaceholderText>
                        )}

                        {isProcessing && (
                            <LoadingWrapper>
                                <LoadingOutlined style={{ fontSize: "48px" }} />
                                <LoadingText>Đang xử lý ảnh...</LoadingText>
                            </LoadingWrapper>
                        )}

                        {processedImage && !isProcessing && (
                            <>
                                <Image src={processedImage} alt="Processed" />
                                <ImageInfo>
                                    {processedImageSize && (
                                        <>
                                            <InfoText>Ảnh đã xử lý</InfoText>
                                            <InfoText>
                                                {(
                                                    processedImageSize / 1024
                                                ).toFixed(2)}{" "}
                                                KB
                                            </InfoText>
                                            {originalFile && (
                                                <CompressionRate
                                                    $isReduced={
                                                        processedImageSize <
                                                        originalFile.size
                                                    }
                                                >
                                                    {processedImageSize <
                                                    originalFile.size
                                                        ? `↓ Giảm ${(
                                                              ((originalFile.size -
                                                                  processedImageSize) /
                                                                  originalFile.size) *
                                                              100
                                                          ).toFixed(1)}%`
                                                        : processedImageSize >
                                                          originalFile.size
                                                        ? `↑ Tăng ${(
                                                              ((processedImageSize -
                                                                  originalFile.size) /
                                                                  originalFile.size) *
                                                              100
                                                          ).toFixed(1)}%`
                                                        : "Không đổi"}
                                                </CompressionRate>
                                            )}
                                        </>
                                    )}
                                </ImageInfo>
                                <DownloadButton
                                    onClick={() =>
                                        handleDownload(
                                            processedImage,
                                            `processed_${
                                                originalFile?.name ||
                                                "image.jpg"
                                            }`
                                        )
                                    }
                                >
                                    <DownloadOutlined />
                                    Tải xuống
                                </DownloadButton>
                            </>
                        )}
                    </ImageCard>
                </ImageSection>
            </ImagesWrapper>

            {/* Button xử lý */}
            <ActionSection>
                <ProcessButton
                    onClick={onProcess}
                    disabled={isProcessing || !originalImage}
                >
                    {isProcessing ? "Đang xử lý..." : "Xử lý ảnh"}
                </ProcessButton>

                {error && <ErrorMessage>{error}</ErrorMessage>}
            </ActionSection>
        </ChatContainer>
    );
};

// Styled Components (giữ nguyên)
const ChatContainer = styled.div`
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
`;

const ImagesWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const ImageSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const SectionTitle = styled.h3`
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0;
`;

const ImageCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
`;

const Image = styled.img`
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
    border-radius: 8px;
`;

const ImageInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    margin-top: 10px;
`;

const InfoText = styled.span`
    font-size: 0.9rem;
    color: #9ca3af;
`;

const CompressionRate = styled.span<{ $isReduced: boolean }>`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${(props) => (props.$isReduced ? "#10b981" : "#f59e0b")};
    margin-top: 4px;
    padding: 4px 8px;
    background: ${(props) =>
        props.$isReduced
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(245, 158, 11, 0.1)"};
    border-radius: 4px;
`;

const PlaceholderText = styled.p`
    font-size: 1rem;
    color: #6b7280;
    text-align: center;
`;

const LoadingWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    color: #ff6f5c;
`;

const LoadingText = styled.p`
    font-size: 1.1rem;
    color: #9ca3af;
    margin: 0;
`;

const ActionSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
`;

const ProcessButton = styled.button`
    min-width: 200px;
    height: 50px;
    padding: 0 30px;
    border-radius: 8px;
    border: none;
    background-color: #ff6f5c;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: #d63925;
        transform: scale(1.05);
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const DownloadButton = styled.button`
    width: 100%;
    max-width: 200px;
    height: 45px;
    padding: 0 20px;
    border-radius: 8px;
    border: none;
    background-color: #10b981;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 15px;

    &:hover {
        background-color: #059669;
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const ErrorMessage = styled.p`
    color: #ef4444;
    font-size: 0.95rem;
    margin: 0;
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.3);
`;
