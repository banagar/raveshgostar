// src/App.jsx

import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PageLayout from "./layouts/PageLayout"; // ✅ ایمپورت چیدمان جدید
import LoginPage from "./pages/LoginPage";
import ManageFormsPage from "./pages/ManageFormsPage";
import ManageFieldsPage from "./pages/ManageFieldsPage";
import DashboardPage from "./pages/DashboardPage";
import RecordsListPage from "./pages/RecordsListPage";
import CreateEditRecordPage from "./pages/CreateEditRecordPage";

// صفحات دیگر را بعداً کامل می‌کنیم
const NotFoundPage = () => <h1>صفحه مورد نظر یافت نشد (404)</h1>;

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />

            {/* ✅ جایگزینی MainLayout با PageLayout */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <PageLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="manage/forms" element={<ManageFormsPage />} />
                <Route path="manage/forms/:formId/fields" element={<ManageFieldsPage />} />
                <Route path="forms/:formId/records" element={<RecordsListPage />} />{" "}
                <Route path="forms/:formId/records/new" element={<CreateEditRecordPage />} />
                <Route
                    path="forms/:formId/records/:recordId/edit"
                    element={<CreateEditRecordPage />}
                />
                <Route
                    path="forms/:formId/records/:recordId/view"
                    element={<CreateEditRecordPage />}
                />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}

export default App;
