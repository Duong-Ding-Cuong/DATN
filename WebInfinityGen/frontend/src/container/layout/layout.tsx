import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Dropdown, Layout, Menu } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { sidebarUnitItems } from "./constant";

const { Sider } = Layout;

interface SidebarItem {
    key: string;
    path?: string;
    children?: SidebarItem[];
}

export const MyLayout = ({
    children,
    styles,
}: {
    children: React.ReactNode;
    styles?: React.CSSProperties;
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [username, setUsername] = useState<string>("user");

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.username) {
                    setUsername(userObj.username);
                }
            }
        } catch {
            // fallback giữ nguyên username mặc định
        }
    }, []);
    const navigate = useNavigate();
    const location = useLocation();

    const onClick = (e: { key: string }) => {
        const key = e.key;

        const findPath = (items: SidebarItem[]): string | undefined => {
            for (const item of items) {
                if (item.key === key && item.path) return item.path;
                if (item.children) {
                    const child = findPath(item.children);
                    if (child) return child;
                }
            }
            return undefined;
        };

        const path = findPath(sidebarUnitItems);
        if (path) navigate(path);
    };

    // Tìm key tương ứng với path hiện tại
    const findKeyByPath = (
        items: SidebarItem[],
        targetPath: string
    ): string | undefined => {
        for (const item of items) {
            if (item.path === targetPath) return item.key;
            if (item.children) {
                const childKey = findKeyByPath(item.children, targetPath);
                if (childKey) return childKey;
            }
        }
        return undefined;
    };

    // Tìm tất cả parent keys để mở submenu
    const findOpenKeys = (
        items: SidebarItem[],
        targetKey: string,
        parents: string[] = []
    ): string[] => {
        for (const item of items) {
            if (item.key === targetKey) return parents;
            if (item.children) {
                const found = findOpenKeys(item.children, targetKey, [
                    ...parents,
                    item.key,
                ]);
                if (found.length > 0) return found;
            }
        }
        return [];
    };
    const currentKey =
        findKeyByPath(sidebarUnitItems, location.pathname) || "1";
    const openKeys = findOpenKeys(sidebarUnitItems, currentKey);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#ffffff",
                },
                components: {
                    Menu: {
                        itemColor: "#ffffff",
                        itemSelectedColor: "#7b4937",
                        itemHoverColor: "#c6613f",
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
                    width={240}
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
                        selectedKeys={[currentKey]}
                        // defaultSelectedKeys={["1"]}
                        defaultOpenKeys={openKeys}
                        items={sidebarUnitItems}
                        onClick={onClick}
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
                                        onClick: (info) => {
                                            if (info.key === "1") {
                                                localStorage.removeItem("user");
                                                navigate("/login");
                                            }
                                        },
                                    }}
                                    trigger={["click"]}
                                >
                                    <div
                                        style={{
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            gap: 8,
                                            display: "flex",
                                        }}
                                    >
                                        {username}
                                        <DownOutlined />
                                    </div>
                                </Dropdown>
                            </div>
                        </div>
                    </Header>
                    {/* Content */}
                    <Layout
                        style={{
                            borderLeft: "1px solid #303030",
                            position: "relative",
                        }}
                    >
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
