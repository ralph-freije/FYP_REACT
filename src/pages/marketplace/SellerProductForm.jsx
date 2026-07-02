import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  analyzeSellerProductImpact,
  createSellerProduct,
  getSellerProduct,
  updateSellerProduct,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  MarketplaceImage,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";
import ProductImageCropper from "../../components/ProductImageCropper";

const categories = [
  "Reusable Products",
  "Solar & Energy",
  "Eco Home",
  "Sustainable Fashion",
  "Food & Kitchen",
  "Stationery",
  "Carbon Offsets",
];

const emptyForm = {
  name: "",
  category: categories[0],
  description: "",
  price: "",
  stock: "",
  origin_country: "",
  packaging_type: "",
  is_active: true,
};

const defaultAnalysis = {
  eco_score: null,
  carbon_saving_value: null,
  sustainability_tags: [],
  impact_summary: "AI will generate the eco impact after analyzing your product details.",
  ai_impact_explanation: "Eco score and carbon saving are locked because EcoTrack calculates them with AI.",
};

function toFormData(form, imageFile, isActive, cropData) {
  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value);
  });
  formData.set("is_active", isActive ? "1" : "0");
  if (imageFile) formData.append("image", imageFile);
  if (cropData) {
    formData.append("image_crop_x", cropData.image_crop_x ?? 0);
    formData.append("image_crop_y", cropData.image_crop_y ?? 0);
    formData.append("image_crop_width", cropData.image_crop_width ?? 0);
    formData.append("image_crop_height", cropData.image_crop_height ?? 0);
  }
  return formData;
}

export default function SellerProductForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(emptyForm);
  const [analysis, setAnalysis] = useState(defaultAnalysis);
  const [imageFile, setImageFile] = useState(null);
  const [originalImageFile, setOriginalImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCrop, setImageCrop] = useState(null);
  const [productSlug, setProductSlug] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getSellerProduct(id);
        const product = response.data.product;
        setProductSlug(product.slug || "");
        setForm({
          name: product.name || "",
          category: product.category || categories[0],
          description: product.description || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          origin_country: product.origin_country || "",
          packaging_type: product.packaging_type || "",
          is_active: Boolean(product.is_active),
        });
        setAnalysis({
          eco_score: product.eco_score,
          carbon_saving_value: product.carbon_saving_value,
          sustainability_tags: product.sustainability_tags || [],
          impact_summary: product.impact_summary || defaultAnalysis.impact_summary,
          ai_impact_explanation: product.ai_impact_explanation || defaultAnalysis.ai_impact_explanation,
        });
        setImagePreview(product.image_url || null);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load product."));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isEdit]);

  const previewProduct = useMemo(
    () => ({
      id: id || "preview",
      name: form.name || "Organic Hemp Tote Bag",
      category: form.category || "Eco Product",
      description:
        form.description ||
        "Your product description will appear here as customers browse your sustainable catalog.",
      price: Number(form.price || 0),
      image_url: imagePreview,
      image_path: imagePreview,
      eco_score: analysis.eco_score,
      carbon_saving_value: analysis.carbon_saving_value,
      sustainability_tags: analysis.sustainability_tags || [],
    }),
    [analysis, form, id, imagePreview]
  );

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Keep the original only for the crop UI. The file sent to Laravel is
    // replaced by ProductImageCropper with a real square JPEG. This makes the
    // upload work even if the server cannot crop with GD.
    setOriginalImageFile(file);
    setImageFile(file);
    setImageCrop(null);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCroppedImage = useCallback((croppedFile, previewUrl) => {
    if (croppedFile) {
      setImageFile(croppedFile);
    }

    setImagePreview(previewUrl);

    // Because React now uploads the already-cropped square JPEG, Laravel should
    // not crop it again using coordinates from the original photo. Send square
    // coordinates that match the uploaded file itself.
    setImageCrop({
      image_crop_x: 0,
      image_crop_y: 0,
      image_crop_width: 1000,
      image_crop_height: 1000,
    });
  }, []);

  const handleAnalyze = async () => {
    if (!form.name.trim()) {
      setError("Add a product title before generating AI impact.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setSuccess("");
      const response = await analyzeSellerProductImpact({
        name: form.name,
        category: form.category,
        description: form.description,
        price: form.price,
        origin_country: form.origin_country,
        packaging_type: form.packaging_type,
      });
      setAnalysis(response.data.analysis || defaultAnalysis);
      setSuccess("AI eco impact generated. It will be regenerated when you save.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to generate AI impact."));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (event, isActive = true) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const payload = toFormData(form, imageFile, isActive, imageCrop);
      const response = isEdit
        ? await updateSellerProduct(id, payload)
        : await createSellerProduct(payload);
      const product = response.data.product;
      setSuccess(response.data.message || "Product saved.");
      setTimeout(() => {
        navigate("/seller/products", { replace: true });
      }, 500);
      if (product) {
        setAnalysis({
          eco_score: product.eco_score,
          carbon_saving_value: product.carbon_saving_value,
          sustainability_tags: product.sustainability_tags || [],
          impact_summary: product.impact_summary || defaultAnalysis.impact_summary,
          ai_impact_explanation: product.ai_impact_explanation || defaultAnalysis.ai_impact_explanation,
        });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save product."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MarketplaceDashboardShell title={isEdit ? "Edit Product" : "Add Product"}>
        <StateBlock title="Loading product...">Preparing your product editor.</StateBlock>
      </MarketplaceDashboardShell>
    );
  }

  return (
    <MarketplaceDashboardShell
      title={isEdit ? "Edit Product" : "List New Product"}
      subtitle="Eco score and carbon saved are generated by EcoTrack AI using Google AI Studio."
      actions={
        <>
          <Link to="/seller/products" className="mp-btn-light">
            <span className="material-symbols-outlined">arrow_back</span>
            My Products
          </Link>
          {isEdit && (
            <Link to={productSlug ? `/marketplace/products/${productSlug}` : "/marketplace"} className="mp-btn-light">
              <span className="material-symbols-outlined">visibility</span>
              Public View
            </Link>
          )}
        </>
      }
    >
      <form className="seller-product-form-page" encType="multipart/form-data" onSubmit={(event) => handleSubmit(event, true)}>
        {error && <div className="mp-alert error">{error}</div>}
        {success && <div className="mp-alert success">{success}</div>}

        <div className="seller-product-form-grid">
          <div className="seller-product-form-left">
            <section className="seller-editor-card">
              <div className="seller-editor-heading">
                <span className="material-symbols-outlined is-filled">info</span>
                <h2>Basic Information</h2>
              </div>
              <div className="seller-editor-fields two">
                <label className="full">
                  <span>Product Title</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="e.g., Organic Hemp Tote Bag"
                    required
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="full">
                  <span>Detailed Description</span>
                  <textarea
                    rows="4"
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Describe the product, how customers use it, durability, and sustainable benefits..."
                  />
                </label>
              </div>
            </section>

            <section className="seller-editor-card">
              <div className="seller-editor-heading">
                <span className="material-symbols-outlined is-filled">payments</span>
                <h2>Pricing & Inventory</h2>
              </div>
              <div className="seller-editor-fields three">
                <label>
                  <span>Price (USD)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  <span>Stock Quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => updateField("stock", event.target.value)}
                    placeholder="100"
                    required
                  />
                </label>
                <label>
                  <span>Origin Country</span>
                  <input
                    value={form.origin_country}
                    onChange={(event) => updateField("origin_country", event.target.value)}
                    placeholder="Lebanon"
                  />
                </label>
                <label>
                  <span>Packaging Type</span>
                  <input
                    value={form.packaging_type}
                    onChange={(event) => updateField("packaging_type", event.target.value)}
                    placeholder="Recycled cardboard, compostable wrap..."
                  />
                </label>
              </div>
            </section>

            <section className="seller-editor-card">
              <div className="seller-editor-heading">
                <span className="material-symbols-outlined is-filled">add_photo_alternate</span>
                <h2>Product Images</h2>
              </div>
              <label className="seller-upload-zone">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                <span className="material-symbols-outlined">upload_file</span>
                <strong>{originalImageFile ? originalImageFile.name : "Drag and drop image here"}</strong>
                <small>JPG, PNG or WEBP. Use the square crop preview below before saving.</small>
              </label>
              <ProductImageCropper file={originalImageFile} onCrop={handleCroppedImage} />
            </section>

            <section className="seller-editor-card seller-ai-card">
              <div className="seller-editor-heading">
                <span className="material-symbols-outlined is-filled">auto_awesome</span>
                <h2>AI Eco Impact Analysis</h2>
              </div>
              <div className="seller-ai-feature-note">
                <span className="material-symbols-outlined is-filled">verified</span>
                <div>
                  <strong>AI-generated impact</strong>
                  <p>Eco score and carbon saved are locked for sellers. EcoTrack AI uses your product title, category, description, price, and origin to calculate them when you preview or save.</p>
                </div>
              </div>
              <div className="seller-ai-result-grid">
                <article>
                  <span>Eco Score</span>
                  <strong>{analysis.eco_score ?? "--"}</strong>
                  <small>/100</small>
                </article>
                <article>
                  <span>Carbon Saved</span>
                  <strong>{analysis.carbon_saving_value ?? "--"}</strong>
                  <small>kg CO₂/month</small>
                </article>
                <article className="wide">
                  <span>Generated Tags</span>
                  <div className="seller-ai-tags">
                    {(analysis.sustainability_tags || []).length ? (
                      analysis.sustainability_tags.map((tag) => <b key={tag}>{tag}</b>)
                    ) : (
                      <b>Waiting for AI</b>
                    )}
                  </div>
                </article>
              </div>
              <div className="seller-ai-explanation">
                <span className="material-symbols-outlined is-filled">psychology</span>
                <p>{analysis.ai_impact_explanation || defaultAnalysis.ai_impact_explanation}</p>
              </div>
              <button type="button" className="mp-btn-light seller-ai-preview-btn" onClick={handleAnalyze} disabled={analyzing}>
                <span className="material-symbols-outlined is-filled">auto_awesome</span>
                {analyzing ? "Generating AI Impact..." : "Generate AI Impact Preview"}
              </button>
            </section>
          </div>

          <aside className="seller-product-preview-column">
            <div className="seller-product-preview-card">
              <div className="seller-product-preview-media">
                <MarketplaceImage
                  product={previewProduct}
                  alt={previewProduct.name}
                  seed="product-preview"
                />
                <div className="seller-preview-badges">
                  <span>
                    <i className="material-symbols-outlined is-filled">eco</i>
                    {analysis.eco_score ?? "AI"}
                  </span>
                  <span>
                    <i className="material-symbols-outlined">energy_savings_leaf</i>
                    {analysis.carbon_saving_value ?? "--"}kg saved
                  </span>
                </div>
              </div>
              <div className="seller-product-preview-body">
                <p>{previewProduct.category}</p>
                <h3>{previewProduct.name}</h3>
                <span>{previewProduct.description}</span>
                <div className="seller-preview-tags">
                  {(analysis.sustainability_tags || []).slice(0, 3).map((tag) => (
                    <b key={tag}>{tag}</b>
                  ))}
                </div>
                <div className="seller-preview-price-row">
                  <div>
                    <small>Retail Price</small>
                    <strong>{formatCurrency(previewProduct.price)}</strong>
                  </div>
                  <button type="button" disabled>
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="seller-product-form-actions">
              <button type="button" className="mp-btn-light" onClick={(event) => handleSubmit(event, false)} disabled={saving}>
                Save Draft
              </button>
              <button type="submit" className="mp-btn" disabled={saving}>
                <span className="material-symbols-outlined is-filled">check_circle</span>
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Publish Product"}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </MarketplaceDashboardShell>
  );
}
