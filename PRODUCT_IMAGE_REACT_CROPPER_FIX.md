# Product Image Real Data + Square Crop Fix

This project now implements product image handling in both Laravel and React.

## Backend: FYP_LARAVEL

- Product image upload is handled in `app/Http/Controllers/Api/SellerMarketplaceController.php`.
- Add/update product requests accept the crop support fields:
  - `image_crop_x`
  - `image_crop_y`
  - `image_crop_width`
  - `image_crop_height`
- Laravel saves uploaded product images under `storage/app/public/marketplace/products`.
- When crop fields are available, Laravel crops the original image using those coordinates and saves a square JPG.
- If crop fields are missing, Laravel center-crops the image to a square JPG.
- If an image is missing or broken, the frontend falls back to the placeholder.
- Public API responses return formatted product image URLs plus raw paths where useful.
- Seeded products use existing files from `storage/app/public/marketplace/products` instead of fake slug `.jpg` paths.
- Backend placeholder asset: `public/images/marketplace/product-placeholder.svg`.

## Frontend: FYP_REACT

- Shared product image resolver: `src/utils/productImages.js`.
- Shared marketplace image component: `src/pages/marketplace/MarketplaceShared.jsx`.
- Root marketplace product card resolver: `src/components/MarketplaceProductCard.jsx`.
- React square crop tool: `src/components/ProductImageCropper.jsx`.
- Laravel/Vite-compatible square crop utility: `FYP_LARAVEL/resources/js/product-image-square-cropper.js`.
- Seller add/edit form integration: `src/pages/marketplace/SellerProductForm.jsx`.
- React sends the original image plus the crop fields so Laravel stores the same visible square crop.
- Frontend placeholder asset: `public/marketplace-product-placeholder.svg`.

## Product image locations checked

- Home products
- Marketplace product list
- Product details
- Store products / related products
- Cart
- Checkout / order success / order failure / order history
- Seller dashboard
- Seller products
- Seller orders
- Admin product moderation
- Admin marketplace analytics/top products

## Fallback behavior

The real uploaded product image is used first. If it is empty, invalid, missing from storage, or fails to load in the browser, the placeholder is used as fallback.
