import React, { useState } from "react";
import {
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Dropdown, Layout, Menu } from "antd";
import { Content, Header } from "antd/es/layout/layout";

const { Sider } = Layout;

export const MyLayout = ({
    children,
    styles,
}: {
    children: React.ReactNode;
    styles?: React.CSSProperties;
}) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <ConfigProvider
            theme={{
                components: {
                    Menu: {
                        itemColor: "#ffffff",
                        itemSelectedColor: "#ffffff",
                        itemHoverColor: "#ffffff",
                        itemSelectedBg: "#303030",
                        itemActiveBg: "#303030",
                    },
                },
            }}
        >
            <Layout style={{ minHeight: "100vh" }}>
                {/* Sidebar */}
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    style={{ background: "#181818" }}
                    width={260}
                >
                    <div
                        className="demo-logo-vertical"
                        style={{
                            height: 64,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                        }}
                    >
                        <Button
                            type="text"
                            icon={
                                collapsed ? (
                                    <MenuUnfoldOutlined
                                        style={{ color: "#fff" }}
                                    />
                                ) : (
                                    <MenuFoldOutlined
                                        style={{ color: "#fff" }}
                                    />
                                )
                            }
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: "16px",
                                width: 64,
                                height: 64,
                                display: "flex",
                                alignItems: "center",
                            }}
                        />
                    </div>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={["1"]}
                        items={[
                            {
                                key: "1",
                                icon: <UserOutlined />,
                                label: "nav 1",
                            },
                            {
                                key: "2",
                                icon: <VideoCameraOutlined />,
                                label: "nav 2",
                            },
                            {
                                key: "3",
                                icon: <UploadOutlined />,
                                label: "nav 3",
                            },
                        ]}
                        style={{
                            background: "#181818",
                            color: "#fff",
                        }}
                    />
                </Sider>

                {/* Main Layout */}
                <Layout>
                    {/* Header */}
                    <Header
                        style={{
                            background: "#212121",
                            padding: "0 20px",
                            color: "#fff",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 26,
                                        fontWeight: "bold",
                                        color: "#fff",
                                    }}
                                >
                                    InfinityGen
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 20,
                                }}
                            >
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                key: "1",
                                                label: "Logout",
                                            },
                                        ],
                                    }}
                                    trigger={["click"]}
                                >
                                    <div
                                        style={{
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontSize: 16,
                                        }}
                                    >
                                        {/* {asyncGetMe.data?.userName || "User"}{" "} */}
                                        username
                                        <DownOutlined />
                                    </div>
                                </Dropdown>
                            </div>
                        </div>
                    </Header>
                    {/* Content */}
                    <Layout style={{ borderLeft: "1px solid #303030" }}>
                        <Content
                            style={{
                                width: "100%",
                                background: "#212121",
                                paddingLeft: "5%",
                                paddingRight: "5%",
                                ...styles,
                            }}
                        >
                            {children}
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};
