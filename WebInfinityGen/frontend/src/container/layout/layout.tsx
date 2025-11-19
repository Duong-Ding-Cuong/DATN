import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DownOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Dropdown, Layout, Menu } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { sidebarUnitItems, n8nMenuItem } from "./constant";
import { ChatHistoryMenu } from "./chat-history-menu";

const { Sider } = Layout;

interface SidebarItem {
    key: string;
    path?: string;
    domain?: string;
    children?: SidebarItem[];
    label?: string;
    icon?: React.ReactNode;
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
    const [menuItems, setMenuItems] = useState<SidebarItem[]>(sidebarUnitItems);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                if (userObj && userObj.username) {
                    setUsername(userObj.username);
                }
                // Kiểm tra role admin
                if (userObj && userObj.role === "admin") {
                    setMenuItems([...sidebarUnitItems, n8nMenuItem]);
                }
            }
        } catch {
            // fallback giữ nguyên username mặc định
        }
    }, []);
    const navigate = useNavigate();
    const location = useLocation();

    // Xử lý tạo chat mới - trigger event để component chat xử lý
    const handleNewChat = (path: string) => {
        // Dispatch event để notify component chat
        window.dispatchEvent(
            new CustomEvent("createNewChat", {
                detail: { path },
            })
        );

        // Navigate to path without chatId
        navigate(path);
    };

    // Add nút "+" vào menu items có path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addNewChatButton = (items: SidebarItem[]): any[] => {
        return items.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newItem: any = { ...item };

            if (item.path && !item.domain) {
                // Thêm nút "+" cho items có path
                newItem.label = (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <span>{item.label}</span>
                        <PlusOutlined
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNewChat(item.path!);
                            }}
                            style={{
                                fontSize: "12px",
                                padding: "4px",
                                borderRadius: "4px",
                                transition: "all 0.2s",
                                color: "#888",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#c6613f";
                                e.currentTarget.style.background = "#2a2a2a";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#888";
                                e.currentTarget.style.background =
                                    "transparent";
                            }}
                        />
                    </div>
                );
            }

            if (item.children) {
                newItem.children = addNewChatButton(item.children);
            }

            return newItem;
        });
    };

    const menuItemsWithButton = addNewChatButton(menuItems);

    const onClick = (e: { key: string }) => {
        const key = e.key;

        const findPathOrDomain = (
            items: SidebarItem[]
        ): { path?: string; domain?: string } | undefined => {
            for (const item of items) {
                if (item.key === key) {
                    if (item.path) return { path: item.path };
                    if (item.domain) return { domain: item.domain };
                }
                if (item.children) {
                    const child = findPathOrDomain(item.children);
                    if (child) return child;
                }
            }
            return undefined;
        };

        const result = findPathOrDomain(menuItems);
        if (result?.path) {
            navigate(result.path);
        } else if (result?.domain) {
            window.open(result.domain, "_blank");
        }
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
    const currentKey = findKeyByPath(menuItems, location.pathname) || "1";
    const openKeys = findOpenKeys(menuItems, currentKey);

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
                        defaultOpenKeys={openKeys}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        items={menuItemsWithButton as any}
                        onClick={onClick}
                        style={{
                            background: "#181818",
                            color: "#fff",
                        }}
                    />

                    {/* Chat History Section */}
                    {!collapsed && <ChatHistoryMenu />}
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
