import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Space, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface LoginFormData {
    email: string;
    password: string;
}

interface User {
    id: string;
    email: string;
}

interface LoginProps {
    onLogin?: (user: User) => void;
    onNavigateToChat?: () => void;
    apiUrl?: string;
}

export const LoginComponent: React.FC<LoginProps> = ({
    onLogin,
    onNavigateToChat,
    apiUrl = "http://localhost:5000",
}) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Hàm xử lý chuyển hướng khi nhấn nút 'Đăng ký ngay'
    const handleGoToRegister = () => {
        navigate("/register");
    };

    const [loginError, setLoginError] = useState<string>("");
    const onFinish = async (values: LoginFormData) => {
        setLoading(true);
        setLoginError("");
        try {
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await response.json();
            if (data.success && data.data?.user) {
                message.success(data.message || "Đăng nhập thành công!");
                localStorage.setItem("user", JSON.stringify(data.data.user));
                if (onLogin) {
                    onLogin(data.data.user);
                }
                if (onNavigateToChat) {
                    onNavigateToChat();
                } else {
                    navigate("/chat/new");
                }
            } else {
                console.log("lỗi: ", data);
                setLoginError(
                    data.message || "Email hoặc mật khẩu không đúng!"
                );
            }
        } catch {
            setLoginError(
                "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#2f2f2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Card
                style={{
                    width: "100%",
                    maxWidth: 500,
                    background: "inherit",
                    borderRadius: 16,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                }}
            >
                <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%", textAlign: "center" }}
                >
                    {/* Header */}
                    <div>
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                background: "#ac522e",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                            }}
                        >
                            <LockOutlined
                                style={{ fontSize: 24, color: "white" }}
                            />
                        </div>
                        <Title
                            level={2}
                            style={{ margin: "0 0 8px", color: "#ffffff" }}
                        >
                            Đăng nhập
                        </Title>
                        <Text style={{ color: "#ffffff" }} type="secondary">
                            Chào mừng bạn trở lại!
                        </Text>
                    </div>

                    {/* Login Form */}
                    <div style={{ width: "100%" }}>
                        <Form
                            name="login"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                            initialValues={{
                                email: "",
                                password: "",
                            }}
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập email!",
                                    },
                                    {
                                        type: "email",
                                        message: "Email không hợp lệ!",
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="Email"
                                    style={{ borderRadius: 8 }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập mật khẩu!",
                                    },
                                    {
                                        min: 6,
                                        message:
                                            "Mật khẩu phải có ít nhất 6 ký tự!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Mật khẩu"
                                    style={{ borderRadius: 8 }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    style={{
                                        height: 48,
                                        borderRadius: 8,
                                        background:
                                            "linear-gradient(135deg, #ac522e, #252fb8)",
                                        border: "none",
                                        fontSize: 16,
                                        fontWeight: 600,
                                    }}
                                >
                                    {loading
                                        ? "Đang đăng nhập..."
                                        : "Đăng nhập"}
                                </Button>
                                {loginError && (
                                    <div
                                        style={{
                                            color: "#ff4d4f",
                                            marginTop: 8,
                                            textAlign: "center",
                                        }}
                                    >
                                        {loginError}
                                    </div>
                                )}
                            </Form.Item>
                        </Form>
                    </div>

                    {/* Actions */}
                    <Space
                        direction="vertical"
                        size="middle"
                        style={{ width: "100%", textAlign: "end" }}
                    >
                        <Button
                            type="link"
                            onClick={() =>
                                message.info(
                                    "Tính năng quên mật khẩu đang được phát triển"
                                )
                            }
                            style={{ padding: 0, color: "#fff" }}
                        >
                            Quên mật khẩu?
                        </Button>

                        <div
                            style={{
                                textAlign: "center",
                                paddingTop: 16,
                                borderTop: "1px solid #444",
                            }}
                        >
                            <Text type="secondary" style={{ color: "#ffffff" }}>
                                Chưa có tài khoản?{" "}
                                <Button
                                    type="link"
                                    onClick={handleGoToRegister}
                                    style={{
                                        padding: 0,
                                        fontWeight: "bold",
                                        color: "#ac522e",
                                    }}
                                >
                                    Đăng ký ngay
                                </Button>
                            </Text>
                        </div>
                    </Space>
                </Space>
            </Card>
        </div>
    );
};
