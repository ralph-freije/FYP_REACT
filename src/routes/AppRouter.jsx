import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import OAuthSuccess from "../pages/OAuthSuccess";
import SettingsPage from "../pages/SettingsPage";
import ProtectedRoute from "../components/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
import ActivityPage from "../pages/ActivityPage";
import ActivityHistory from "../pages/ActivityHistory";
import AdminPage from "../pages/AdminPage";
import Communities from "../pages/Communities";
import People from "../pages/People";
import Messages from "../pages/Messages";
import Notifications from "../pages/Notifications";
import Leaderboards from "../pages/Leaderboards";
import ChallengesPage from "../pages/ChallengesPage";
import AdminChallenges from "../pages/AdminChallenges";
import { AboutPage, ContactPage, HomePage } from "../pages/public/PublicPages";
import MarketplaceHome from "../pages/MarketplaceHome";
import MarketplaceProductDetails from "../pages/MarketplaceProductDetails";
import MarketplaceCart from "../pages/MarketplaceCart";
import MarketplaceCheckout from "../pages/MarketplaceCheckout";
import MarketplaceOrderSuccess from "../pages/MarketplaceOrderSuccess";
import MarketplaceOrderFailed from "../pages/MarketplaceOrderFailed";
import MarketplaceOrders from "../pages/MarketplaceOrders";
import MarketplaceSellerApply from "../pages/MarketplaceSellerApply";
import SellerDashboard from "../pages/marketplace/SellerDashboard";
import SellerProducts from "../pages/marketplace/SellerProducts";
import SellerProductForm from "../pages/marketplace/SellerProductForm";
import SellerOrders from "../pages/marketplace/SellerOrders";
import SellerStoreSettings from "../pages/marketplace/SellerStoreSettings";
import AdminSellerApplications from "../pages/marketplace/AdminSellerApplications";
import AdminStores from "../pages/marketplace/AdminStores";
import AdminMarketplaceProducts from "../pages/marketplace/AdminMarketplaceProducts";
import StorePage from "../pages/marketplace/StorePage";
import PageMeta from "../components/PageMeta";

function AppRouter() {
  return (
    <BrowserRouter>
      <PageMeta />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/marketplace" element={<MarketplaceHome />} />
        <Route path="/marketplace/products/:slug" element={<MarketplaceProductDetails />} />
        <Route path="/stores/:slug" element={<StorePage />} />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <MarketplaceCart />
            </ProtectedRoute>
          }
        />


        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <MarketplaceCheckout />
            </ProtectedRoute>
          }
        />




        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MarketplaceOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id/success"
          element={
            <ProtectedRoute>
              <MarketplaceOrderSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id/failed"
          element={
            <ProtectedRoute>
              <MarketplaceOrderFailed />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/apply"
          element={
            <ProtectedRoute>
              <MarketplaceSellerApply />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/products"
          element={
            <ProtectedRoute>
              <SellerProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/products/new"
          element={
            <ProtectedRoute>
              <SellerProductForm mode="create" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/products/:id/edit"
          element={
            <ProtectedRoute>
              <SellerProductForm mode="edit" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute>
              <SellerOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/store-settings"
          element={
            <ProtectedRoute>
              <SellerStoreSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/seller-applications"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminSellerApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminStores />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/marketplace-products"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminMarketplaceProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/challenges"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminChallenges />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track"
          element={
            <ProtectedRoute>
              <Navigate to="/activity" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ActivityHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <Communities />
            </ProtectedRoute>
          }
        />

        <Route
          path="/people"
          element={
            <ProtectedRoute>
              <People />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboards"
          element={
            <ProtectedRoute>
              <Leaderboards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/challenges"
          element={
            <ProtectedRoute>
              <ChallengesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={localStorage.getItem("token") ? "/dashboard" : "/"}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
