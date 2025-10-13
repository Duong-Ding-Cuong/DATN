import React, { Suspense } from "react";
import "./App.css";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";

const NewChat = React.lazy(() => import("./pages/new-chat"));
const Login = React.lazy(() => import("./pages/login"));
const Register = React.lazy(() => import("./pages/register"));

// ProtectedRoute: chỉ cho vào nếu đã đăng nhập (có user trong localStorage)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isLoggedIn = Boolean(localStorage.getItem("user"));
    return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <ConfigProvider theme={{}}>
            <Router>
                <Suspense fallback={<>Loading... </>}>
                    <Routes>
                        <Route path="/" element={<>Home</>} />
                        <Route
                            path="/chat/new"
                            element={
                                <ProtectedRoute>
                                    <NewChat />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </Suspense>
            </Router>
        </ConfigProvider>
    );
}

export default App;
