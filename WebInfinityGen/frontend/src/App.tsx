import React, { Suspense } from "react";
import "./App.css";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";

const NewChat = React.lazy(() => import("./pages/chat-text-to-text"));
const Login = React.lazy(() => import("./pages/login"));
const Register = React.lazy(() => import("./pages/register"));
const ChatFileToText = React.lazy(() => import("./pages/chat-file-to-text"));
const CreateImage = React.lazy(() => import("./pages/create-image"));
const IncreaseImageResolution = React.lazy(
    () => import("./pages/increase-image-resolution")
);
const HandleImage = React.lazy(() => import("./pages/handle-image"));
const BackgroundSeparation = React.lazy(
    () => import("./pages/background-separation")
);
const CreateGame = React.lazy(() => import("./pages/create-game"));
const ImageCompression = React.lazy(() => import("./pages/image-compression"));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    const isLoggedIn = Boolean(token);
    return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
    return (
        <ConfigProvider theme={{}}>
            <Router>
                <Suspense fallback={<>Loading... </>}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Navigate
                                    to={
                                        localStorage.getItem("token")
                                            ? "/chat/new"
                                            : "/login"
                                    }
                                    replace
                                />
                            }
                        />
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
                        <Route
                            path="/chat/file-to-text"
                            element={<ChatFileToText />}
                        />
                        <Route
                            path="/chat/create-image"
                            element={<CreateImage />}
                        />
                        <Route
                            path="/chat/increase-image-resolution"
                            element={<IncreaseImageResolution />}
                        />
                        <Route
                            path="/chat/handle-image"
                            element={
                                <ProtectedRoute>
                                    <HandleImage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chat/background-separation"
                            element={
                                <ProtectedRoute>
                                    <BackgroundSeparation />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chat/create-game"
                            element={
                                <ProtectedRoute>
                                    <CreateGame />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chat/image-compression"
                            element={
                                <ProtectedRoute>
                                    <ImageCompression />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </Router>
        </ConfigProvider>
    );
}

export default App;
