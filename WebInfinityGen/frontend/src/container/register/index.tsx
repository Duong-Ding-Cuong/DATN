import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Space, message } from "antd";
import {
    UserOutlined,
    MailOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
}

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
}

interface RegisterProps {
    onRegister?: (user: User) => void;
    apiUrl?: string;
}

export const RegisterComponent: React.FC<RegisterProps> = ({
    onRegister,
    apiUrl = "http://localhost:5000",
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const handleRegister = async (values: RegisterFormData) => {
        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });

            const result = await response.json();

            if (result.success) {
                message.success(result.message);

                // Gọi callback nếu có
                if (onRegister && result.data?.user) {
                    onRegister(result.data.user);
                }

                // Reset form
                form.resetFields();
                // Chuyển hướng sang trang login
                navigate("/login");
                setError("");
            } else {
                setError(result.message || "Đã xảy ra lỗi, vui lòng thử lại!");
            }
        } catch (error: any) {
            if (error.response && error.response.status === 409) {
                setError(error.response.data.message); // Hiển thị lỗi trùng email
            } else if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                setError(error.response.data.message);
            } else {
                setError("Đã xảy ra lỗi, vui lòng thử lại!");
            }
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý chuyển hướng khi nhấn nút 'Đăng nhập ngay'
    const handleGoToLogin = () => {
        navigate("/login");
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
                    borderRadius: 16,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    background: "inherit",
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
                            <UserOutlined
                                style={{ fontSize: 24, color: "white" }}
                            />
                        </div>
                        <Title
                            level={2}
                            style={{ margin: "0 0 8px", color: "#ffffff" }}
                        >
                            Đăng ký
                        </Title>
                        <Text type="secondary" style={{ color: "#ffffff" }}>
                            Tạo tài khoản mới
                        </Text>
                    </div>

                    {/* Register Form */}
                    <div style={{ width: "100%" }}>
                        <Form
                            form={form}
                            name="register"
                            onFinish={handleRegister}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập tên người dùng",
                                    },
                                    {
                                        min: 2,
                                        message:
                                            "Tên người dùng phải có ít nhất 2 ký tự",
                                    },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Tên người dùng"
                                    style={{ borderRadius: 8 }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                rules={[
                                    {
                                        required: true,
                                        message: "Vui lòng nhập email",
                                    },
                                    {
                                        type: "email",
                                        message: "Email không hợp lệ",
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
                                        message: "Vui lòng nhập mật khẩu",
                                    },
                                    {
                                        min: 6,
                                        message:
                                            "Mật khẩu phải có ít nhất 6 ký tự",
                                    },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Mật khẩu"
                                    iconRender={(visible) =>
                                        visible ? (
                                            <EyeTwoTone />
                                        ) : (
                                            <EyeInvisibleOutlined />
                                        )
                                    }
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
                                        ? "Đang đăng ký..."
                                        : "Tạo tài khoản"}
                                </Button>
                                {error && (
                                    <div
                                        style={{
                                            color: "red",
                                            marginTop: 8,
                                            textAlign: "center",
                                        }}
                                    >
                                        {error}
                                    </div>
                                )}
                            </Form.Item>
                        </Form>
                    </div>

                    {/* Social Login */}
                    <div style={{ width: "100%" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                color: "#999",
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    height: 1,
                                    background: "#e0e0e0",
                                }}
                            ></div>
                            <span style={{ padding: "0 16px", fontSize: 14 }}>
                                Hoặc đăng ký với
                            </span>
                            <div
                                style={{
                                    flex: 1,
                                    height: 1,
                                    background: "#e0e0e0",
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <Text type="secondary" style={{ color: "#ffffff" }}>
                            Đã có tài khoản?{" "}
                            <Button
                                type="link"
                                onClick={handleGoToLogin}
                                style={{
                                    padding: 0,
                                    fontWeight: "bold",
                                    color: "#ac522e",
                                }}
                            >
                                Đăng nhập ngay
                            </Button>
                        </Text>
                    </div>
                </Space>
            </Card>
        </div>
    );
};
